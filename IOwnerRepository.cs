using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface IOwnerRepository
    {
        Task<Owner> CreateAsync(Owner owner);
        Task<Owner?> GetByIdAsync(Guid id);
        Task<List<Owner>> GetAllAsync();
        Task<Owner?> UpdateAsync(Guid id, Owner owner);
        Task<Owner?> DeleteAsync(Guid id);
    }
}
