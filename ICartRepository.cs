using Property_management_system.Models.Domain;

namespace Property_management_system.Repositories.Interface
{
    public interface ICartRepository
    {
        Task<Cart> GetCartByTenantIdAsync(Guid tenantId);
        Task<CartItem> AddItemAsync(Guid tenantId, Guid propertyId, decimal price);
        Task<bool> UpdateSelectionAsync(Guid itemId, bool selected);
        Task<bool> RemoveItemAsync(Guid itemId);
        Task<bool> ClearCartAsync(Guid tenantId);

        Task<bool> DeleteByPropertyIdAsync(Guid propertyId);
    }
}
