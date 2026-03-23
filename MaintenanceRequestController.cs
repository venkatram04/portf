using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Property_management_system.Models.DTO;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MaintenanceRequestController : ControllerBase
    {
        private readonly IMaintenanceRequestRepository requestRepository;

        public MaintenanceRequestController(IMaintenanceRequestRepository requestRepository)
        {
            this.requestRepository = requestRepository;
        }

        [HttpGet]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetAllRequests()
        {
            var requests = await requestRepository.GetAllAsync();
            var response = requests.Select(r => new MaintenanceRequestResponseDto
            {
                RequestID = r.RequestID,
                PropertyID = r.PropertyID,
                TenantID = r.TenantID,
                IssueDescription = r.IssueDescription,
                Status = r.Status,
                CreatedAt = r.CreatedAt
            });

            return Ok(response);
        }

        [HttpGet("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetRequestById([FromRoute] Guid id)
        {
            var request = await requestRepository.GetByIdAsync(id);
            if (request == null) return NotFound();

            var response = new MaintenanceRequestResponseDto
            {
                RequestID = request.RequestID,
                PropertyID = request.PropertyID,
                TenantID = request.TenantID,
                IssueDescription = request.IssueDescription,
                Status = request.Status,
                CreatedAt = request.CreatedAt
            };

            return Ok(response);
        }

        [HttpGet("tenant/{tenantId:Guid}")]
        [Authorize(Roles = "Tenant")]
        public async Task<IActionResult> GetRequestsByTenant([FromRoute] Guid tenantId)
        {
            var requests = await requestRepository.GetByTenantIdAsync(tenantId);
            var response = requests.Select(r => new MaintenanceRequestResponseDto
            {
                RequestID = r.RequestID,
                PropertyID = r.PropertyID,
                TenantID = r.TenantID,
                IssueDescription = r.IssueDescription,
                Status = r.Status,
                CreatedAt = r.CreatedAt
            });

            return Ok(response);
        }

        [HttpGet("owner/{ownerId:Guid}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> GetRequestsByOwner([FromRoute] Guid ownerId)
        {
            var requests = await requestRepository.GetByOwnerIdAsync(ownerId);
            var response = requests.Select(r => new MaintenanceRequestResponseDto
            {
                RequestID = r.RequestID,
                PropertyID = r.PropertyID,
                TenantID = r.TenantID,
                IssueDescription = r.IssueDescription,
                Status = r.Status,
                CreatedAt = r.CreatedAt
            });

            return Ok(response);
        }

        [HttpPost]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateMaintenanceRequestDto request)
        {
            var newRequest = new MaintenanceRequest
            {
                PropertyID = request.PropertyID,
                TenantID = request.TenantID,
                IssueDescription = request.IssueDescription,
                Status = request.Status
            };

            var created = await requestRepository.CreateAsync(newRequest);

            var response = new MaintenanceRequestResponseDto
            {
                RequestID = created.RequestID,
                PropertyID = created.PropertyID,
                TenantID = created.TenantID,
                IssueDescription = created.IssueDescription,
                Status = created.Status,
                CreatedAt = created.CreatedAt
            };

            return Ok(response);
        }

        [HttpPut("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> UpdateRequest([FromRoute] Guid id, [FromBody] UpdateMaintenanceRequestDto request)
        {
            var updated = new MaintenanceRequest
            {
                PropertyID = request.PropertyID,
                TenantID = request.TenantID,
                IssueDescription = request.IssueDescription,
                Status = request.Status
            };

            var result = await requestRepository.UpdateAsync(id, updated);
            if (result == null) return NotFound();

            var response = new MaintenanceRequestResponseDto
            {
                RequestID = result.RequestID,
                PropertyID = result.PropertyID,
                TenantID = result.TenantID,
                IssueDescription = result.IssueDescription,
                Status = result.Status,
                CreatedAt = result.CreatedAt
            };

            return Ok(response);
        }

        [HttpDelete("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> DeleteRequest([FromRoute] Guid id)
        {
            var deleted = await requestRepository.DeleteAsync(id);
            if (deleted == null) return NotFound();

            var response = new MaintenanceRequestResponseDto
            {
                RequestID = deleted.RequestID,
                PropertyID = deleted.PropertyID,
                TenantID = deleted.TenantID,
                IssueDescription = deleted.IssueDescription,
                Status = deleted.Status,
                CreatedAt = deleted.CreatedAt
            };

            return Ok(response);
        }
    }
}
