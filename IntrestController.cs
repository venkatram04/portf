using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Property_management_system.Models.Domain;
using Property_management_system.Models.DTO;
using Property_management_system.Repositories.Implementation;
using Property_management_system.Repositories.Interface;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InterestController : ControllerBase
    {
        private readonly IInterestRepository interestRepository;
        private readonly IPropertyRepository propertyRepository;
        private readonly ITenantRepository tenantRepository;
        private readonly IOwnerRepository ownerRepository;

        public InterestController(IInterestRepository interestRepository, IPropertyRepository propertyRepository, ITenantRepository tenantRepository, IOwnerRepository ownerRepository)
        {
            this.interestRepository = interestRepository;
            this.propertyRepository = propertyRepository;
            this.tenantRepository = tenantRepository;
            this.ownerRepository = ownerRepository;
        }

        // ✅ Tenant posts interest
        [HttpPost]
        [Authorize(Roles = "Tenant")]
        public async Task<IActionResult> CreateInterest([FromBody] InterestCreateDto request)
        {
            // Extract token from header
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return BadRequest("No JWT token found.");

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Get email from claims
            var email = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email))
                return Unauthorized("Email not found in token.");

            // Lookup tenant by email
            var tenant = (await tenantRepository.GetAllAsync())
                .FirstOrDefault(t => t.Email.ToLower() == email.ToLower());

            if (tenant == null)
                return Unauthorized("Tenant not found.");

            var loggedInTenantId = tenant.TenantID;

            // Verify tenant id matches request
            if (request.TenantID != loggedInTenantId)
                return BadRequest("TenantID in request does not match logged-in TenantID.");

            // Create interest
            var newInterest = new Interest
            {
                TenantID = loggedInTenantId,
                PropertyID = request.PropertyID,
                Status = "I'm Interested"
            };

            var created = await interestRepository.CreateAsync(newInterest);

            var response = new InterestResponseDto
            {
                InterestID = created.InterestID,
                TenantID = created.TenantID,
                PropertyID = created.PropertyID,
                Status = created.Status,
                CreatedAt = created.CreatedAt
            };

            return Ok(response);
        }


        // ✅ Owner approves/rejects interest
        [HttpPut("{id:Guid}/status")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> UpdateInterestStatus([FromRoute] Guid id, [FromBody] InterestStatusUpdateDto request)
        {
            var interest = await interestRepository.GetByIdAsync(id);
            if (interest == null) return NotFound("Interest not found.");

            var property = await propertyRepository.GetByIdAsync(interest.PropertyID);
            if (property == null) return NotFound("Property not found.");

            // ✅ Extract token
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return BadRequest("No JWT token found.");

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // ✅ Get email from claims
            var email = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email))
                return Unauthorized("Email not found in token.");

            // ✅ Lookup owner by email
            var owner = (await ownerRepository.GetAllAsync())
                .FirstOrDefault(o => o.Email.ToLower() == email.ToLower());

            if (owner == null && !User.IsInRole("Admin"))
                return Unauthorized("Owner not found.");

            // ✅ Verify property belongs to this owner (unless Admin)
            if (!User.IsInRole("Admin") && property.OwnerID != owner.OwnerID)
            {
                return Forbid("You are not authorized to update this interest.");
            }

            // ✅ Update status
            interest.Status = request.Status;
            var updated = await interestRepository.UpdateAsync(id, interest);

            var response = new InterestResponseDto
            {
                InterestID = updated.InterestID,
                TenantID = updated.TenantID,
                PropertyID = updated.PropertyID,
                Status = updated.Status,
                CreatedAt = updated.CreatedAt
            };

            return Ok(response);
        }


        // ✅ Get all interests for a property (Owner/Admin)
        [HttpGet("property/{propertyId:Guid}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> GetInterestsByProperty([FromRoute] Guid propertyId)
        {
            var interests = await interestRepository.GetByPropertyIdAsync(propertyId);
            var response = interests.Select(i => new InterestResponseDto
            {
                InterestID = i.InterestID,
                TenantID = i.TenantID,
                PropertyID = i.PropertyID,
                Status = i.Status,
                CreatedAt = i.CreatedAt
            });

            return Ok(response);
        }

        // ✅ Tenant can view their own interests
        [HttpGet("tenant/{tenantId:Guid}")]
        [Authorize(Roles = "Tenant")]
        public async Task<IActionResult> GetInterestsByTenant([FromRoute] Guid tenantId)
        {
            // Extract token from header
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return BadRequest("No JWT token found.");

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Get email from claims
            var email = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email))
                return Unauthorized("Email not found in token.");

            // Lookup tenant by email
            var tenant = (await tenantRepository.GetAllAsync())
                .FirstOrDefault(t => t.Email.ToLower() == email.ToLower());

            if (tenant == null)
                return Unauthorized("Tenant not found.");

            var loggedInTenantId = tenant.TenantID;

            // Verify route tenantId matches logged-in tenant
            if (tenantId != loggedInTenantId)
            {
                return Forbid("You can only view your own interests.");
            }

            var interests = await interestRepository.GetByTenantIdAsync(tenantId);
            var response = interests.Select(i => new InterestResponseDto
            {
                InterestID = i.InterestID,
                TenantID = i.TenantID,
                PropertyID = i.PropertyID,
                Status = i.Status,
                CreatedAt = i.CreatedAt
            });

            return Ok(response);
        }

    }
}
