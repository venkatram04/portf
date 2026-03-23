using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly PropertyDbContext dbContext;

        public PaymentRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<List<Payment>> GetAllAsync()
        {
            return await dbContext.Payments.ToListAsync();
        }

        public async Task<Payment?> GetByIdAsync(Guid id)
        {
            return await dbContext.Payments.FirstOrDefaultAsync(p => p.PaymentID == id);
        }

        public async Task<List<Payment>> GetByLeaseIdAsync(Guid leaseId)
        {
            return await dbContext.Payments
                .Where(p => p.LeaseID == leaseId)
                .ToListAsync();
        }

        public async Task<List<Payment>> GetByTenantIdAsync(Guid tenantId)
        {
            return await dbContext.Payments
                .Where(p => dbContext.Leases
                    .Any(l => l.LeaseID == p.LeaseID && l.TenantID == tenantId))
                .ToListAsync();
        }


        public async Task<Payment> CreateAsync(Payment payment)
        {
            payment.PaymentID = Guid.NewGuid();
            await dbContext.Payments.AddAsync(payment);
            await dbContext.SaveChangesAsync();
            return payment;
        }
    }
}
