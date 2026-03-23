using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class OwnerRepository : IOwnerRepository
    {
        private readonly PropertyDbContext dbContext;

        public OwnerRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<Owner> CreateAsync(Owner owner)
        {
            await dbContext.Owners.AddAsync(owner);
            await dbContext.SaveChangesAsync();
            return owner;
        }

        public async Task<List<Owner>> GetAllAsync()
        {
            return await dbContext.Owners.ToListAsync();
        }

        public async Task<Owner?> GetByIdAsync(Guid id)
        {
            return await dbContext.Owners.FindAsync(id);
        }

        public async Task<Owner?> UpdateAsync(Guid id, Owner updatedOwner)
        {
            var existingOwner = await dbContext.Owners.FindAsync(id);
            if (existingOwner == null) return null;

            existingOwner.Name = updatedOwner.Name;
            existingOwner.Email = updatedOwner.Email;

            await dbContext.SaveChangesAsync();
            return existingOwner;
        }

        public async Task<Owner?> DeleteAsync(Guid id)
        {
            var owner = await dbContext.Owners.FindAsync(id);
            if (owner == null) return null;

            dbContext.Owners.Remove(owner);
            await dbContext.SaveChangesAsync();
            return owner;
        }
    }
}
