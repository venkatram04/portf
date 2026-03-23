using Microsoft.AspNetCore.Identity;

namespace Property_management_system.Repositories.Interface
{
    public interface ITokenRepository
    {
        string CreateJwtToken(IdentityUser user, List<string> roles);
    }
}
