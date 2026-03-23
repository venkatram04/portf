using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Repositories.Implementation
{
    public class CartRepository : ICartRepository
    {
        private readonly PropertyDbContext dbContext;

        public CartRepository(PropertyDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<Cart> GetCartByTenantIdAsync(Guid tenantId)
        {
            var cart = await dbContext.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TenantId == tenantId);

            if (cart == null)
            {
                cart = new Cart { TenantId = tenantId };
                dbContext.Carts.Add(cart);
                await dbContext.SaveChangesAsync();
            }

            return cart;
        }

        public async Task<CartItem> AddItemAsync(Guid tenantId, Guid propertyId, decimal price)
        {
            var property = await dbContext.Properties.FirstOrDefaultAsync(p => p.PropertyID == propertyId);
            if (property == null)
            {
                throw new InvalidOperationException("Property not found.");
            }

            if (property.Status != "Available")
            {
                throw new InvalidOperationException("Property is currently leased and unavailable.");
            }

            var activeLease = await dbContext.Leases
                .FirstOrDefaultAsync(l => l.PropertyID == propertyId && l.EndDate > DateTime.UtcNow);

            if (activeLease != null)
            {
                throw new InvalidOperationException("Property is currently under an active lease and cannot be added to the cart.");
            }

            var cart = await GetCartByTenantIdAsync(tenantId);

            var item = new CartItem
            {
                CartId = cart.Id,
                PropertyId = propertyId,
                Price = price
            };

            dbContext.CartItems.Add(item);
            await dbContext.SaveChangesAsync();
            return item;
        }

        public async Task<bool> UpdateSelectionAsync(Guid itemId, bool selected)
        {
            var item = await dbContext.CartItems.FindAsync(itemId);
            if (item == null) return false;

            item.Selected = selected;
            await dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveItemAsync(Guid itemId)
        {
            var item = await dbContext.CartItems
                .FirstOrDefaultAsync(ci => ci.Id == itemId);

            if (item == null)
            {
                Console.WriteLine($"CartItem not found for ID: {itemId}");
                return false;
            }

            dbContext.CartItems.Remove(item);
            await dbContext.SaveChangesAsync();
            return true;
        }


        public async Task<bool> ClearCartAsync(Guid tenantId)
        {
            var cart = await GetCartByTenantIdAsync(tenantId);
            dbContext.CartItems.RemoveRange(cart.Items);
            await dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteByPropertyIdAsync(Guid propertyId)
        {
            var items = await dbContext.CartItems
                .Where(ci => ci.PropertyId == propertyId)
                .ToListAsync();

            if (items.Count == 0) return false;

            dbContext.CartItems.RemoveRange(items);
            await dbContext.SaveChangesAsync();
            return true;
        }
    }
}
