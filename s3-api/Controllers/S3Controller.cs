using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace s3.Controllers;

public partial class S3Controller(IAmazonS3 s3Client, IOptions<S3Settings> s3Settings) : BaseApiController
{
  [HttpGet("images/{key}/presigned")]
  public IResult GetImageUrl(string key)
  {
    try
    {
      var request = new GetPreSignedUrlRequest
      {
        BucketName = s3Settings.Value.BucketName,
        Key = key,
        Verb = HttpVerb.GET,
        Expires = DateTime.UtcNow.AddMinutes(15)
      };

      string presignedUrl = s3Client.GetPreSignedURL(request);
      return Results.Ok(new { key, url = presignedUrl });
    }
    catch (AmazonS3Exception ex)
    {
      return Results.BadRequest($"S3 error generating pre-signed URL: {ex.Message}");
    }
  }

  [HttpPost("images")]
  public async Task<IResult> UploadImages(IFormFile file)
  {
    if (file.Length == 0)
    {
      return Results.BadRequest("No file uploaded");
    }

    using var stream = file.OpenReadStream();

    var key = Guid.NewGuid();
    var putRequest = new PutObjectRequest
    {
      BucketName = s3Settings.Value.BucketName,
      Key = $"{key}",
      InputStream = stream,
      ContentType = file.ContentType,
      Metadata = {
        ["file-name"]= file.FileName
      }
    };
    await s3Client.PutObjectAsync(putRequest);
    return Results.Ok(key);
  }

  [HttpDelete("images/{key}")]
  public async Task<IResult> DeleteImageWithKey(string key)
  {
    try
    {
      var deleteRequest = new DeleteObjectRequest
      {
        BucketName = s3Settings.Value.BucketName,
        Key = key
      };

      await s3Client.DeleteObjectAsync(deleteRequest);
      return Results.Ok($"Image with key {key} deleted successfully.");
    }
    catch (AmazonS3Exception ex)
    {
      return Results.BadRequest($"S3 error deleting image: {ex.Message}");
    }
  }
}