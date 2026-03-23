using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class TenantRepository : ITenantRepository
    {
        private readonly PropertyDbContext dbContext;

        public TenantRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<Tenant> CreateAsync(Tenant tenant)
        {
            await dbContext.Tenants.AddAsync(tenant);
            await dbContext.SaveChangesAsync();
            return tenant;
        }

        public async Task<List<Tenant>> GetAllAsync()
        {
            return await dbContext.Tenants
                .Include(t => t.Leases)
                .Include(t => t.MaintenanceRequests)
                .ToListAsync();
        }

        public async Task<Tenant?> GetByIdAsync(Guid id)
        {
            return await dbContext.Tenants
                .Include(t => t.Leases)
                .Include(t => t.MaintenanceRequests)
                .FirstOrDefaultAsync(t => t.TenantID == id);
        }

        public async Task<Tenant?> UpdateAsync(Guid id, Tenant updatedTenant)
        {
            var existingTenant = await dbContext.Tenants.FindAsync(id);
            if (existingTenant == null) return null;

            existingTenant.Name = updatedTenant.Name;
            existingTenant.Email = updatedTenant.Email;
            existingTenant.PhoneNumber = updatedTenant.PhoneNumber;
            existingTenant.ContactDetails = updatedTenant.ContactDetails;
            existingTenant.RentalHistory = updatedTenant.RentalHistory;
            existingTenant.ImageBase64 = updatedTenant.ImageBase64;
            existingTenant.ImageContentType = updatedTenant.ImageContentType;

            await dbContext.SaveChangesAsync();
            return existingTenant;
        }

        public async Task<Tenant?> DeleteAsync(Guid id)
        {
            var tenant = await dbContext.Tenants.FindAsync(id);
            if (tenant == null) return null;

            dbContext.Tenants.Remove(tenant);
            await dbContext.SaveChangesAsync();
            return tenant;
        }
    }
}
