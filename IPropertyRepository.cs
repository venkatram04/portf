using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface IPropertyRepository
    {
        Task<List<Property>> GetAllAsync();
        Task<Property?> GetByIdAsync(Guid id);
        Task<Property> CreateAsync(Property property);
        Task<Property?> UpdateAsync(Property property);
        Task<Property?> DeleteAsync(Guid id);
        Task<bool> UpdateAvailabilityAsync(Guid propertyId, string status);

        Task<List<Property>> GetByOwnerIdAsync(Guid ownerId);
    }
}
