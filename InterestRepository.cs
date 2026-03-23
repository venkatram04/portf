using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class InterestRepository : IInterestRepository
    {
        private readonly PropertyDbContext dbContext;

        public InterestRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<Interest> CreateAsync(Interest interest)
        {
            await dbContext.Interests.AddAsync(interest);
            await dbContext.SaveChangesAsync();
            return interest;
        }

        public async Task<Interest?> GetByIdAsync(Guid id)
        {
            return await dbContext.Interests
                .Include(i => i.Property)
                .Include(i => i.Tenant)
                .FirstOrDefaultAsync(i => i.InterestID == id);
        }

        public async Task<IEnumerable<Interest>> GetByTenantIdAsync(Guid tenantId)
        {
            return await dbContext.Interests
                .Where(i => i.TenantID == tenantId)
                .Include(i => i.Property)
                .ToListAsync();
        }

        public async Task<IEnumerable<Interest>> GetByPropertyIdAsync(Guid propertyId)
        {
            return await dbContext.Interests
                .Where(i => i.PropertyID == propertyId)
                .Include(i => i.Tenant)
                .ToListAsync();
        }

        public async Task<Interest?> UpdateAsync(Guid id, Interest interest)
        {
            var existing = await dbContext.Interests.FirstOrDefaultAsync(i => i.InterestID == id);
            if (existing == null) return null;

            existing.Status = interest.Status;
            existing.PropertyID = interest.PropertyID;
            existing.TenantID = interest.TenantID;

            await dbContext.SaveChangesAsync();
            return existing;
        }
    }
}
