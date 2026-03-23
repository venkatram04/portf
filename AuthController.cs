//Namespaces and Dependencies
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Property_management_system.Models.Domain;
using Property_management_system.Models.DTO;
using Property_management_system.Repositories.Interface;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection.Emit;
using System.Security.Claims;
using System.Text;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> userManager;
        private readonly ITokenRepository tokenRepository;
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly IOwnerRepository ownerRepository;
        private readonly ITenantRepository tenantRepository;
        private readonly ILogger<AuthController> logger;


        public AuthController(
            UserManager<IdentityUser> userManager,
            ITokenRepository tokenRepository,
            RoleManager<IdentityRole> roleManager,
            IOwnerRepository ownerRepository,
            ITenantRepository tenantRepository,
            ILogger<AuthController> logger)
        {
            this.userManager = userManager;
            this.tokenRepository = tokenRepository;
            this.roleManager = roleManager;
            this.ownerRepository = ownerRepository;
            this.tenantRepository = tenantRepository;
            this.logger = logger;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var identityUser = await userManager.FindByEmailAsync(request.Email);

            if (identityUser == null)
            {
                return Unauthorized(new { message = "Email is incorrect." });
            }

            var isPasswordValid = await userManager.CheckPasswordAsync(identityUser, request.Password);
            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Password is incorrect." });
            }

            var roles = await userManager.GetRolesAsync(identityUser);

            
            Guid? ownerId = null;
            Guid? tenantId = null;

            
            if (roles.Contains("Owner"))
            {
                var owner = (await ownerRepository.GetAllAsync())
                    .FirstOrDefault(o => o.Email.ToLower() == request.Email.ToLower());
                if (owner == null) return Unauthorized(new { message = "Owner account has been deleted." });
                ownerId = owner.OwnerID;
            }

            
            if (roles.Contains("Tenant"))
            {
                
                var tenant = (await tenantRepository.GetAllAsync())
                    .FirstOrDefault(t => t.Email.ToLower() == request.Email.ToLower());
                if (tenant == null) return Unauthorized(new { message = "Tenant account has been deleted." });
                tenantId = tenant.TenantID;
            }

            
            var token = tokenRepository.CreateJwtToken(identityUser, roles.ToList());

            return Ok(new LoginResponseDto
            {
                Email = request.Email,
                Roles = roles.ToList(),
                Token = token,
                OwnerID = ownerId,
                TenantID = tenantId
            });
        }

        
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromForm] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var normalizedEmail = request.Email.Trim();

            
            string role = request.RoleEnum?.ToString();
            if (string.IsNullOrWhiteSpace(role) || !(role == "Owner" || role == "Tenant" || role == "Admin"))
                return BadRequest(new { message = $"Role '{request.RoleEnum}' is not recognized." });

            var user = new IdentityUser
            {
                UserName = normalizedEmail,
                Email = normalizedEmail
            };

            var createResult = await userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
                return BadRequest(new { errors = createResult.Errors.Select(e => e.Description) });

            if (!await roleManager.RoleExistsAsync(role))
                return BadRequest(new { message = $"Role '{role}' does not exist. Please seed roles." });

            var roleResult = await userManager.AddToRoleAsync(user, role);
            if (!roleResult.Succeeded)
                return BadRequest(new { errors = roleResult.Errors.Select(e => e.Description) });

            Guid? ownerId = null;
            Guid? tenantId = null;

            if (role == "Owner")
            {
                try
                {
                    var owner = new Owner
                    {
                        Name = string.IsNullOrWhiteSpace(request.Name) ? normalizedEmail.Split('@')[0] : request.Name,
                        Email = normalizedEmail,
                        PhoneNumber = request.PhoneNumber ?? string.Empty,
                        ContactDetails = string.IsNullOrWhiteSpace(request.ContactDetails) ? normalizedEmail : request.ContactDetails
                    };

                    if (request.Image != null && request.Image.Length > 0)
                    {
                        using var ms = new MemoryStream();
                        await request.Image.CopyToAsync(ms);
                        owner.ImageBase64 = Convert.ToBase64String(ms.ToArray());
                        owner.ImageContentType = request.Image.ContentType;
                    }

                    var createdOwner = await ownerRepository.CreateAsync(owner);
                    ownerId = createdOwner.OwnerID;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Owner creation failed for {Email}", normalizedEmail);
                    return StatusCode(500, new { message = "Owner creation failed.", detail = ex.Message });
                }
            }

            if (role == "Tenant")
            {
                try
                {
                    var tenant = new Tenant
                    {
                        Name = string.IsNullOrWhiteSpace(request.Name) ? normalizedEmail.Split('@')[0] : request.Name,
                        Email = normalizedEmail,
                        PhoneNumber = request.PhoneNumber ?? string.Empty,
                        ContactDetails = string.IsNullOrWhiteSpace(request.ContactDetails) ? normalizedEmail : request.ContactDetails,
                        RentalHistory = string.IsNullOrWhiteSpace(request.RentalHistory) ? "New Tenant" : request.RentalHistory
                    };

                    if (request.Image != null && request.Image.Length > 0)
                    {
                        using var ms = new MemoryStream();
                        await request.Image.CopyToAsync(ms);
                        tenant.ImageBase64 = Convert.ToBase64String(ms.ToArray());
                        tenant.ImageContentType = request.Image.ContentType;
                    }

                    var createdTenant = await tenantRepository.CreateAsync(tenant);
                    tenantId = createdTenant.TenantID;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Tenant creation failed for {Email}", normalizedEmail);
                    return StatusCode(500, new { message = "Tenant creation failed.", detail = ex.Message });
                }
            }

            return Ok(new RegisterResponseDto
            {
                Message = "User registered successfully.",
                Email = normalizedEmail,
                Role = role,
                RoleEnum = request.RoleEnum,
                OwnerID = ownerId,
                TenantID = tenantId
            });
        }


        
        [HttpGet("token-details")]
        [Authorize]
        public async Task<IActionResult> GetTokenDetails()
        {
            
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return BadRequest(new { message = "No JWT token found in Authorization header." });

            
            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();

            try
            {
                
                var jwtToken = handler.ReadJwtToken(token);
                var claims = jwtToken.Claims
                    .GroupBy(c => c.Type)
                    .ToDictionary(g => g.Key, g => g.Select(c => c.Value).ToList());

                var email = claims.TryGetValue(ClaimTypes.Email, out var emailList) ? emailList.FirstOrDefault() : null;
                var userId = claims.TryGetValue(ClaimTypes.NameIdentifier, out var idList) ? idList.FirstOrDefault() : null;
                var roles = claims.TryGetValue(ClaimTypes.Role, out var roleList) ? roleList : new List<string>();

                Guid? ownerId = null;
                Guid? tenantId = null;

                if (roles.Contains("Owner") && email != null)
                {
                    var owner = (await ownerRepository.GetAllAsync())
                        .FirstOrDefault(o => o.Email.ToLower() == email.ToLower());
                    if (owner != null) ownerId = owner.OwnerID;
                }

                if (roles.Contains("Tenant") && email != null)
                {
                    var tenant = (await tenantRepository.GetAllAsync())
                        .FirstOrDefault(t => t.Email.ToLower() == email.ToLower());
                    if (tenant != null) tenantId = tenant.TenantID;
                }

                var tokenDetails = new
                {
                    UserId = userId,
                    Email = email,
                    Roles = roles,
                    OwnerID = ownerId,
                    TenantID = tenantId,
                    Issuer = jwtToken.Issuer,
                    Audience = jwtToken.Audiences.ToList(),
                    Expiry = jwtToken.ValidTo,
                    Claims = claims
                };

                return Ok(tokenDetails);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error parsing JWT token");
                return BadRequest(new { message = "Invalid JWT token.", detail = ex.Message });
            }
        }
    }
}
