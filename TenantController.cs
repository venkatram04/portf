using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Property_management_system.Models.DTO;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All endpoints require authentication
    public class TenantController : ControllerBase
    {
        private readonly ITenantRepository tenantRepository;

        public TenantController(ITenantRepository tenantRepository)
        {
            this.tenantRepository = tenantRepository;
        }

        // GET: api/tenant
        [HttpGet]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetAllTenants()
        {
            var tenants = await tenantRepository.GetAllAsync();

            var response = tenants.Select(t => new TenantResponseDto
            {
                TenantID = t.TenantID,
                Name = t.Name,
                Email = t.Email,
                PhoneNumber = t.PhoneNumber,
                ContactDetails = t.ContactDetails,
                RentalHistory = t.RentalHistory,
                ImageBase64 = t.ImageBase64,
                ImageContentType = t.ImageContentType
            });

            return Ok(response);
        }

        // GET: api/tenant/{id}
        [HttpGet("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetTenantById([FromRoute] Guid id)
        {
            var tenant = await tenantRepository.GetByIdAsync(id);
            if (tenant == null) return NotFound();

            var response = new TenantResponseDto
            {
                TenantID = tenant.TenantID,
                Name = tenant.Name,
                Email = tenant.Email,
                PhoneNumber = tenant.PhoneNumber,
                ContactDetails = tenant.ContactDetails,
                RentalHistory = tenant.RentalHistory,
                ImageBase64 = tenant.ImageBase64,
                ImageContentType = tenant.ImageContentType
            };

            return Ok(response);
        }

        // POST: api/tenant
        [HttpPost]
        [Authorize(Roles = "Admin")] // ✅ restrict creation
        public async Task<IActionResult> CreateTenant([FromForm] CreateTenantRequestDto request)
        {
            try
            {
                var tenant = new Tenant
                {
                    Name = request.Name,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    ContactDetails = request.ContactDetails,
                    RentalHistory = request.RentalHistory
                };

                if (request.Image != null && request.Image.Length > 0)
                {
                    using var ms = new MemoryStream();
                    await request.Image.CopyToAsync(ms);
                    tenant.ImageBase64 = Convert.ToBase64String(ms.ToArray());
                    tenant.ImageContentType = request.Image.ContentType;
                }

                var createdTenant = await tenantRepository.CreateAsync(tenant);

                var response = new TenantResponseDto
                {
                    TenantID = createdTenant.TenantID,
                    Name = createdTenant.Name,
                    Email = createdTenant.Email,
                    PhoneNumber = createdTenant.PhoneNumber,
                    ContactDetails = createdTenant.ContactDetails,
                    RentalHistory = createdTenant.RentalHistory,
                    ImageBase64 = createdTenant.ImageBase64,
                    ImageContentType = createdTenant.ImageContentType
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tenant creation failed: {ex.Message}");
            }
        }

        // PUT: api/tenant/{id}
        [HttpPut("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> UpdateTenant([FromRoute] Guid id, [FromForm] UpdateTenantRequestDto request)
        {
            try
            {
                var updatedTenant = new Tenant
                {
                    TenantID = id, // ✅ trust route ID
                    Name = request.Name,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    ContactDetails = request.ContactDetails,
                    RentalHistory = request.RentalHistory
                };

                if (request.Image != null && request.Image.Length > 0)
                {
                    using var ms = new MemoryStream();
                    await request.Image.CopyToAsync(ms);
                    updatedTenant.ImageBase64 = Convert.ToBase64String(ms.ToArray());
                    updatedTenant.ImageContentType = request.Image.ContentType;
                }

                var result = await tenantRepository.UpdateAsync(id, updatedTenant);
                if (result == null) return NotFound();

                var response = new TenantResponseDto
                {
                    TenantID = result.TenantID,
                    Name = result.Name,
                    Email = result.Email,
                    PhoneNumber = result.PhoneNumber,
                    ContactDetails = result.ContactDetails,
                    RentalHistory = result.RentalHistory,
                    ImageBase64 = result.ImageBase64,
                    ImageContentType = result.ImageContentType
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tenant update failed: {ex.Message}");
            }
        }

        // DELETE: api/tenant/{id}
        [HttpDelete("{id:Guid}")]
        [Authorize(Roles = "Admin,Owner")]
        public async Task<IActionResult> DeleteTenant([FromRoute] Guid id)
        {
            try
            {
                var deletedTenant = await tenantRepository.DeleteAsync(id);
                if (deletedTenant == null) return NotFound();

                var response = new TenantResponseDto
                {
                    TenantID = deletedTenant.TenantID,
                    Name = deletedTenant.Name,
                    Email = deletedTenant.Email,
                    PhoneNumber = deletedTenant.PhoneNumber,
                    ContactDetails = deletedTenant.ContactDetails,
                    RentalHistory = deletedTenant.RentalHistory,
                    ImageBase64 = deletedTenant.ImageBase64,
                    ImageContentType = deletedTenant.ImageContentType
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tenant deletion failed: {ex.Message}");
            }
        }
    }
}
