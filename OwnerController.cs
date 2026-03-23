using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Property_management_system.Models.DTO;
using Property_management_system.Services.Interface;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All endpoints require authentication
    public class OwnerController : ControllerBase
    {
        private readonly IOwnerService ownerService;

        public OwnerController(IOwnerService ownerService)
        {
            this.ownerService = ownerService;
        }

        // GET: api/owner
        [HttpGet]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetAllOwners()
        {
            var response = await ownerService.GetAllOwnersAsync();
            return Ok(response);
        }

        // GET: api/owner/{id}
        [HttpGet("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetOwnerById([FromRoute] Guid id)
        {
            var response = await ownerService.GetOwnerByIdAsync(id);
            if (response == null) return NotFound();
            return Ok(response);
        }

        // POST: api/owner
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateOwner([FromForm] CreateOwnerRequestDto request)
        {
            var response = await ownerService.CreateOwnerAsync(request);
            return Ok(response);
        }

        // PUT: api/owner/{id}
        [HttpPut("{id:Guid}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> UpdateOwner([FromRoute] Guid id, [FromForm] UpdateOwnerRequestDto request)
        {
            var response = await ownerService.UpdateOwnerAsync(id, request);
            if (response == null) return NotFound();
            return Ok(response);
        }

        // DELETE: api/owner/{id}
        [HttpDelete("{id:Guid}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> DeleteOwner([FromRoute] Guid id)
        {
            var response = await ownerService.DeleteOwnerAsync(id);
            if (response == null) return NotFound();
            return Ok(response);
        }
    }
}
