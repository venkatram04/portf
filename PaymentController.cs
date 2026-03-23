using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Property_management_system.Models.DTO;
using Property_management_system.Models.Domain;
using Property_management_system.Repositories.Interface;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentRepository paymentRepository;
        private readonly ILeaseRepository leaseRepository;
        private readonly ICartRepository cartRepository;
        private readonly IPropertyRepository propertyRepository;

        public PaymentController(
            IPaymentRepository paymentRepository,
            ILeaseRepository leaseRepository,
            ICartRepository cartRepository,
            IPropertyRepository propertyRepository)
        {
            this.paymentRepository = paymentRepository;
            this.leaseRepository = leaseRepository;
            this.cartRepository = cartRepository;
            this.propertyRepository = propertyRepository;
        }

        [HttpPost]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequestDto request)
        {
            var payment = new Payment
            {
                LeaseID = request.LeaseID,
                Amount = request.Amount,
                PaymentDate = request.PaymentDate,
                Status = request.Status
            };

            var created = await paymentRepository.CreateAsync(payment);

            if (string.Equals(created.Status, "Paid", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(created.Status, "Success", StringComparison.OrdinalIgnoreCase))
            {
                var lease = await leaseRepository.GetByIdAsync(request.LeaseID);
                if (lease != null)
                {
                    var propertyId = lease.PropertyID;

                    await cartRepository.DeleteByPropertyIdAsync(propertyId);
                    await propertyRepository.UpdateAvailabilityAsync(propertyId, "Occupied");
                }
            }

            var response = new PaymentResponseDto
            {
                PaymentID = created.PaymentID,
                LeaseID = created.LeaseID,
                Amount = created.Amount,
                PaymentDate = created.PaymentDate,
                Status = created.Status
            };

            return Ok(response);
        }

        [HttpGet("{id:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetPaymentById([FromRoute] Guid id)
        {
            var payment = await paymentRepository.GetByIdAsync(id);
            if (payment == null) return NotFound("Payment not found.");

            var response = new PaymentResponseDto
            {
                PaymentID = payment.PaymentID,
                LeaseID = payment.LeaseID,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                Status = payment.Status
            };

            return Ok(response);
        }

        [HttpGet("byLease/{leaseId:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetPaymentsByLeaseId([FromRoute] Guid leaseId)
        {
            var payments = await paymentRepository.GetByLeaseIdAsync(leaseId);
            if (payments == null || !payments.Any())
                return NotFound("No payments found for this lease.");

            var response = payments.Select(p => new PaymentResponseDto
            {
                PaymentID = p.PaymentID,
                LeaseID = p.LeaseID,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                Status = p.Status
            });

            return Ok(response);
        }

        [HttpGet("byTenant/{tenantId:Guid}")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetPaymentsByTenantId([FromRoute] Guid tenantId)
        {
            var payments = await paymentRepository.GetByTenantIdAsync(tenantId);
            if (payments == null || !payments.Any())
                return NotFound("No payments found for this tenant.");

            var response = payments.Select(p => new PaymentResponseDto
            {
                PaymentID = p.PaymentID,
                LeaseID = p.LeaseID,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                Status = p.Status
            });

            return Ok(response);
        }


        [HttpGet("all")]
        [Authorize(Roles = "Tenant,Owner,Admin")]
        public async Task<IActionResult> GetAllPayments()
        {
            var payments = await paymentRepository.GetAllAsync();
            if (payments == null || !payments.Any())
                return NotFound("No payments found.");

            var response = payments.Select(p => new PaymentResponseDto
            {
                PaymentID = p.PaymentID,
                LeaseID = p.LeaseID,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                Status = p.Status
            });

            return Ok(response);
        }
    }
}
