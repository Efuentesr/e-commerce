from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings


class SupabaseStorage(S3Boto3Storage):
    """Storage backend para Supabase Storage (compatible con S3)."""

    def url(self, name):
        # URL pública de Supabase: /storage/v1/object/public/<bucket>/<path>
        return (
            f"{settings.SUPABASE_URL}"
            f"/storage/v1/object/public/{self.bucket_name}/{name}"
        )
