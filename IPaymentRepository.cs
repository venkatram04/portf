using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface IPaymentRepository
    {
        Task<List<Payment>> GetAllAsync();

        Task<Payment?> GetByIdAsync(Guid id);

        Task<List<Payment>> GetByLeaseIdAsync(Guid leaseId);

        Task<List<Payment>> GetByTenantIdAsync(Guid tenantId);

        Task<Payment> CreateAsync(Payment payment);
    }
}
