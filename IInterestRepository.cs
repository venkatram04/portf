using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface IInterestRepository
    {
        Task<Interest> CreateAsync(Interest interest);
        Task<Interest?> GetByIdAsync(Guid id);
        Task<IEnumerable<Interest>> GetByTenantIdAsync(Guid tenantId);
        Task<IEnumerable<Interest>> GetByPropertyIdAsync(Guid propertyId);
        Task<Interest?> UpdateAsync(Guid id, Interest interest);
    }
}
