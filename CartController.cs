using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Property_management_system.Models.DTO;
using Property_management_system.Repositories.Interface;
using System.Security.Claims;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Tenant,Admin")]
    public class CartController : ControllerBase
    {
        private readonly ICartRepository cartRepository;

        public CartController(ICartRepository cartRepository)
        {
            this.cartRepository = cartRepository;
        }

        private Guid GetTenantId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var cart = await cartRepository.GetCartByTenantIdAsync(GetTenantId());
            var dto = new CartDto
            {
                Id = cart.Id,
                TenantId = cart.TenantId,
                Items = cart.Items.Select(i => new CartItemDto
                {
                    Id = i.Id,
                    PropertyId = i.PropertyId,
                    Price = i.Price,
                    Selected = i.Selected
                }).ToList()
            };
            return Ok(dto);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddItem([FromBody] AddCartItemDto dto)
        {
            var item = await cartRepository.AddItemAsync(GetTenantId(), dto.PropertyId, dto.Price);
            return Ok(new CartItemDto
            {
                Id = item.Id,
                PropertyId = item.PropertyId,
                Price = item.Price,
                Selected = item.Selected
            });
        }


        [HttpDelete("remove/{itemId}")]
        public async Task<IActionResult> RemoveItem(Guid itemId)
        {
            var success = await cartRepository.RemoveItemAsync(itemId);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] PaymentRequestDto dto)
        {
            // Here you can integrate with your PaymentController logic
            // For now, just clear the cart
            await cartRepository.ClearCartAsync(GetTenantId());
            return Ok(new { message = "Payment successful", amount = dto.Amount });
        }
    }
}
