using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface ITenantRepository
    {
        Task<Tenant> CreateAsync(Tenant tenant);
        Task<List<Tenant>> GetAllAsync();
        Task<Tenant?> GetByIdAsync(Guid id);
        Task<Tenant?> UpdateAsync(Guid id, Tenant tenant);
        Task<Tenant?> DeleteAsync(Guid id);
    }
}
