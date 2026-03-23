using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Property_management_system.Models.DTO;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;
//using System.Security.Claims;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All endpoints require authentication
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyRepository propertyRepository;

        public PropertyController(IPropertyRepository propertyRepository)
        {
            this.propertyRepository = propertyRepository;
        }

        // GET: api/property
        [HttpGet]
        [Authorize(Roles = "Tenant,Admin")]
        public async Task<IActionResult> GetAllProperties()
        {
            var properties = await propertyRepository.GetAllAsync();

            var response = properties.Select(property => new PropertyDto
            {
                PropertyID = property.PropertyID,
                OwnerID = property.OwnerID,
                PropertyName = property.PropertyName,
                Description = property.Description,
                Address = property.Address,
                RentAmount = property.RentAmount,
                AvailabilityStatus = property.AvailabilityStatus
            });

            return Ok(response);
        }

        // ✅ NEW: GET properties by owner ID (explicit)
        // GET: api/property/owner/{ownerId}
        [HttpGet("owner/{ownerId:Guid}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> GetPropertiesByOwnerId([FromRoute] Guid ownerId)
        {
            var ownedProperties = await propertyRepository.GetByOwnerIdAsync(ownerId);

            var response = ownedProperties.Select(p => new PropertyDto
            {
                PropertyID = p.PropertyID,
                OwnerID = p.OwnerID,
                PropertyName = p.PropertyName,
                Description = p.Description,
                Address = p.Address,
                RentAmount = p.RentAmount,
                AvailabilityStatus = p.AvailabilityStatus
            });

            return Ok(response);
        }

        // GET: api/property/{id}
        [HttpGet("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetPropertyById([FromRoute] Guid id)
        {
            var property = await propertyRepository.GetByIdAsync(id);
            if (property == null) return NotFound();

            var response = new PropertyDto
            {
                PropertyID = property.PropertyID,
                OwnerID = property.OwnerID,
                PropertyName = property.PropertyName,
                Description = property.Description,
                Address = property.Address,
                RentAmount = property.RentAmount,
                AvailabilityStatus = property.AvailabilityStatus
            };

            return Ok(response);
        }

        // POST: api/property
        [HttpPost]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> CreateProperty([FromBody] CreatePropertyRequestDto request)
        {
            var property = new Property
            {
                OwnerID = request.OwnerID,
                PropertyName = request.PropertyName,
                Description = request.Description,
                Address = request.Address,
                RentAmount = request.RentAmount,
                AvailabilityStatus = request.AvailabilityStatus
            };

            property = await propertyRepository.CreateAsync(property);

            var response = new PropertyDto
            {
                PropertyID = property.PropertyID,
                OwnerID = property.OwnerID,
                PropertyName = property.PropertyName,
                Description = property.Description,
                Address = property.Address,
                RentAmount = property.RentAmount,
                AvailabilityStatus = property.AvailabilityStatus
            };

            return Ok(response);
        }

        // PUT: api/property/{id}
        [HttpPut("{id:Guid}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> UpdateProperty([FromRoute] Guid id, [FromBody] UpdatePropertyRequestDto request)
        {
            var property = new Property
            {
                PropertyID = id,
                OwnerID = request.OwnerID,
                PropertyName = request.PropertyName,
                Description = request.Description,
                Address = request.Address,
                RentAmount = request.RentAmount,
                AvailabilityStatus = request.AvailabilityStatus
            };

            var updatedProperty = await propertyRepository.UpdateAsync(property);
            if (updatedProperty == null) return NotFound();

            var response = new PropertyDto
            {
                PropertyID = updatedProperty.PropertyID,
                OwnerID = updatedProperty.OwnerID,
                PropertyName = updatedProperty.PropertyName,
                Description = updatedProperty.Description,
                Address = updatedProperty.Address,
                RentAmount = updatedProperty.RentAmount,
                AvailabilityStatus = updatedProperty.AvailabilityStatus
            };

            return Ok(response);
        }

        // DELETE: api/property/{id}
        [HttpDelete("{id:Guid}")]
        [Authorize(Roles = "Owner,Admin")]
        public async Task<IActionResult> DeleteProperty([FromRoute] Guid id)
        {
            var deletedProperty = await propertyRepository.DeleteAsync(id);
            if (deletedProperty == null) return NotFound();

            var response = new PropertyDto
            {
                PropertyID = deletedProperty.PropertyID,
                OwnerID = deletedProperty.OwnerID,
                PropertyName = deletedProperty.PropertyName,
                Description = deletedProperty.Description,
                Address = deletedProperty.Address,
                RentAmount = deletedProperty.RentAmount,
                AvailabilityStatus = deletedProperty.AvailabilityStatus
            };

            return Ok(response);
        }
    }
}
