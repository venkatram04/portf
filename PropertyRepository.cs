using Property_management_system.Models.Domain;
using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class PropertyRepository : IPropertyRepository
    {
        private readonly PropertyDbContext dbContext;

        public PropertyRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<Property> CreateAsync(Property property)
        {
            await dbContext.Properties.AddAsync(property);
            await dbContext.SaveChangesAsync();
            return property;
        }

        public async Task<Property?> DeleteAsync(Guid id)
        {
            var existingProperty = await dbContext.Properties.FirstOrDefaultAsync(x => x.PropertyID == id);

            if (existingProperty != null)
            {
                dbContext.Properties.Remove(existingProperty);
                await dbContext.SaveChangesAsync();
                return existingProperty;
            }

            return null;
        }

        public async Task<List<Property>> GetAllAsync()
        {
            var properties = await dbContext.Properties.ToListAsync();

            foreach (var property in properties)
            {
                var activeLease = await dbContext.Leases
                    .FirstOrDefaultAsync(l => l.PropertyID == property.PropertyID && l.EndDate > DateTime.UtcNow);

                if (activeLease == null && property.Status != "Available")
                {
                    property.Status = "Available";
                    property.AvailabilityStatus = true;
                }
            }

            await dbContext.SaveChangesAsync();
            return properties;
        }

        public async Task<List<Property>> GetByOwnerIdAsync(Guid ownerId)
        {
            var properties = await dbContext.Properties
                .Where(p => p.OwnerID == ownerId)
                .ToListAsync();

            foreach (var property in properties)
            {
                var activeLease = await dbContext.Leases
                    .FirstOrDefaultAsync(l => l.PropertyID == property.PropertyID && l.EndDate > DateTime.UtcNow);

                if (activeLease == null && property.Status != "Available")
                {
                    property.Status = "Available";
                    property.AvailabilityStatus = true;
                }
            }

            await dbContext.SaveChangesAsync();
            return properties;
        }

        public async Task<Property?> GetByIdAsync(Guid id)
        {
            var property = await dbContext.Properties.FirstOrDefaultAsync(x => x.PropertyID == id);

            if (property != null)
            {
                var activeLease = await dbContext.Leases
                    .FirstOrDefaultAsync(l => l.PropertyID == property.PropertyID && l.EndDate > DateTime.UtcNow);

                if (activeLease == null && property.Status != "Available")
                {
                    property.Status = "Available";
                    property.AvailabilityStatus = true;
                    await dbContext.SaveChangesAsync();
                }
            }

            return property;
        }

        public async Task<Property?> UpdateAsync(Property property)
        {
            var existingProperty = await dbContext.Properties
                .FirstOrDefaultAsync(x => x.PropertyID == property.PropertyID);

            if (existingProperty == null)
            {
                return null;
            }

            dbContext.Entry(existingProperty).CurrentValues.SetValues(property);
            await dbContext.SaveChangesAsync();

            return property;
        }

        public async Task<bool> UpdateAvailabilityAsync(Guid propertyId, string status)
        {
            var property = await dbContext.Properties.FirstOrDefaultAsync(p => p.PropertyID == propertyId);
            if (property == null)
                return false;

            property.Status = status;
            property.AvailabilityStatus = status.Equals("Available", StringComparison.OrdinalIgnoreCase);

            await dbContext.SaveChangesAsync();
            return true;
        }
    }
}
