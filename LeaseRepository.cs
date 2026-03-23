using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class LeaseRepository : ILeaseRepository
    {
        private readonly PropertyDbContext dbContext;

        public LeaseRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<List<Lease>> GetAllAsync()
        {
            return await dbContext.Leases.ToListAsync();
        }

        public async Task<Lease?> GetByIdAsync(Guid id)
        {
            return await dbContext.Leases.FirstOrDefaultAsync(l => l.LeaseID == id);
        }

        public async Task<Lease> CreateAsync(Lease lease)
        {
            lease.LeaseID = Guid.NewGuid();
            lease.CreatedAt = DateTime.UtcNow;
            await dbContext.Leases.AddAsync(lease);
            await dbContext.SaveChangesAsync();
            return lease;
        }

        public async Task<Lease?> UpdateAsync(Guid id, Lease lease)
        {
            var existing = await dbContext.Leases.FirstOrDefaultAsync(l => l.LeaseID == id);
            if (existing == null) return null;

            existing.PropertyID = lease.PropertyID;
            existing.TenantID = lease.TenantID;
            existing.InterestID = lease.InterestID; // new field
            existing.StartDate = lease.StartDate;
            existing.EndDate = lease.EndDate;
            existing.RentAmount = lease.RentAmount;
            existing.Status = lease.Status;

            await dbContext.SaveChangesAsync();
            return existing;
        }

        public async Task<Lease?> DeleteAsync(Guid id)
        {
            var lease = await dbContext.Leases.FirstOrDefaultAsync(l => l.LeaseID == id);
            if (lease == null) return null;

            dbContext.Leases.Remove(lease);
            await dbContext.SaveChangesAsync();
            return lease;
        }

        public async Task<List<Lease>> GetByTenantIdAsync(Guid tenantId)
        {
            return await dbContext.Leases
                .Where(l => l.TenantID == tenantId)
                .ToListAsync();
        }

        public async Task<Lease?> GetByInterestIdAsync(Guid interestId)
        {
            return await dbContext.Leases
                .FirstOrDefaultAsync(l => l.InterestID == interestId);
        }
    }
}
