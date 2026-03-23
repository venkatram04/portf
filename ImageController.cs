using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Property_management_system.Data;
using Property_management_system.Models;
using Property_management_system.Models.Domain;
using Property_management_system.Models.DTO;

namespace Property_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : ControllerBase
    {
        private readonly PropertyDbContext _context;

        public ImageController(PropertyDbContext context)
        {
            _context = context;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage([FromForm] ImageUploadDto dto)
        {
            if (dto.File == null || dto.File.Length == 0)
                return BadRequest("No file uploaded.");

            var property = await _context.Properties.FindAsync(dto.PropertyID);
            if (property == null)
                return NotFound($"Property with ID {dto.PropertyID} not found.");

            using var memoryStream = new MemoryStream();
            await dto.File.CopyToAsync(memoryStream);

            var image = new Image
            {
                Id = Guid.NewGuid(),
                FileName = dto.File.FileName,
                ContentType = dto.File.ContentType,
                Data = memoryStream.ToArray(),
                PropertyID = dto.PropertyID
            };

            _context.Images.Add(image);
            await _context.SaveChangesAsync();

            return Ok(new { image.Id, image.PropertyID });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetImage(Guid id)
        {
            var image = await _context.Images.FindAsync(id);
            if (image == null)
                return NotFound();

            return File(image.Data, image.ContentType, image.FileName);
        }

        [HttpGet("metadata/{id}")]
        public async Task<IActionResult> GetImageMetadata(Guid id)
        {
            var image = await _context.Images.FindAsync(id);
            if (image == null)
                return NotFound();

            var response = new ImageResponseDto
            {
                Id = image.Id,
                FileName = image.FileName,
                ContentType = image.ContentType,
                Base64Data = Convert.ToBase64String(image.Data)
            };

            return Ok(response);
        }

        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetImagesByProperty(Guid propertyId)
        {
            var images = await _context.Images
                .Where(img => img.PropertyID == propertyId)
                .Select(img => new ImageResponseDto
                {
                    Id = img.Id,
                    FileName = img.FileName,
                    ContentType = img.ContentType,
                    Base64Data = Convert.ToBase64String(img.Data)
                })
                .ToListAsync();

            return Ok(images);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllImages()
        {
            var images = await _context.Images
                .Select(img => new ImageResponseDto
                {
                    Id = img.Id,
                    FileName = img.FileName,
                    ContentType = img.ContentType,
                    Base64Data = Convert.ToBase64String(img.Data),
                    PropertyID = img.PropertyID
                })
                .ToListAsync();

            return Ok(images);
        }
    }
}
