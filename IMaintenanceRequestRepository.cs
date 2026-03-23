using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface IMaintenanceRequestRepository
    {
        Task<List<MaintenanceRequest>> GetAllAsync();
        Task<MaintenanceRequest?> GetByIdAsync(Guid id);
        Task<MaintenanceRequest> CreateAsync(MaintenanceRequest request);
        Task<MaintenanceRequest?> UpdateAsync(Guid id, MaintenanceRequest request);
        Task<MaintenanceRequest?> DeleteAsync(Guid id);

        Task<List<MaintenanceRequest>> GetByTenantIdAsync(Guid tenantId);
        Task<List<MaintenanceRequest>> GetByOwnerIdAsync(Guid ownerId);
    }
}
