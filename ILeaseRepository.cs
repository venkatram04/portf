using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface ILeaseRepository
    {
        Task<List<Lease>> GetAllAsync();
        Task<Lease?> GetByIdAsync(Guid id);
        Task<Lease> CreateAsync(Lease lease);
        Task<Lease?> UpdateAsync(Guid id, Lease lease);
        Task<Lease?> DeleteAsync(Guid id);

        // ✅ Filter leases by tenant
        Task<List<Lease>> GetByTenantIdAsync(Guid tenantId);

        Task<Lease?> GetByInterestIdAsync(Guid interestId);
    }
}
