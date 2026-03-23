using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class MaintenanceRequestRepository : IMaintenanceRequestRepository
    {
        private readonly PropertyDbContext dbContext;

        public MaintenanceRequestRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<List<MaintenanceRequest>> GetAllAsync()
        {
            return await dbContext.MaintenanceRequests.ToListAsync();
        }

        public async Task<MaintenanceRequest?> GetByIdAsync(Guid id)
        {
            return await dbContext.MaintenanceRequests.FirstOrDefaultAsync(r => r.RequestID == id);
        }

        public async Task<MaintenanceRequest> CreateAsync(MaintenanceRequest request)
        {
            request.RequestID = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            await dbContext.MaintenanceRequests.AddAsync(request);
            await dbContext.SaveChangesAsync();
            return request;
        }

        public async Task<MaintenanceRequest?> UpdateAsync(Guid id, MaintenanceRequest request)
        {
            var existing = await dbContext.MaintenanceRequests.FirstOrDefaultAsync(r => r.RequestID == id);
            if (existing == null) return null;

            existing.PropertyID = request.PropertyID;
            existing.TenantID = request.TenantID;
            existing.IssueDescription = request.IssueDescription;
            existing.Status = request.Status;

            await dbContext.SaveChangesAsync();
            return existing;
        }

        public async Task<MaintenanceRequest?> DeleteAsync(Guid id)
        {
            var request = await dbContext.MaintenanceRequests.FirstOrDefaultAsync(r => r.RequestID == id);
            if (request == null) return null;

            dbContext.MaintenanceRequests.Remove(request);
            await dbContext.SaveChangesAsync();
            return request;
        }

        public async Task<List<MaintenanceRequest>> GetByTenantIdAsync(Guid tenantId)
        {
            return await dbContext.MaintenanceRequests
                .Where(r => r.TenantID == tenantId)
                .ToListAsync();
        }

        public async Task<List<MaintenanceRequest>> GetByOwnerIdAsync(Guid ownerId)
        {
            return await dbContext.MaintenanceRequests
                .Join(dbContext.Properties,
                      request => request.PropertyID,
                      property => property.PropertyID,
                      (request, property) => new { request, property })
                .Where(joined => joined.property.OwnerID == ownerId)
                .Select(joined => joined.request)
                .ToListAsync();
        }
    }
}
