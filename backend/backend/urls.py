from django.contrib import admin
from django.urls import path, include, re_path
from api.views import PublicTokenObtainPairView, PublicTokenRefreshView

from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="LLM Benchmark API",
        default_version='v1',
        description="API documentation for LLM Benchmarking Platform",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', PublicTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', PublicTokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('api.urls')),

    # Swagger/OpenAPI
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
