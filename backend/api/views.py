from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import LLM, LLMResult, UnitTest, LLMUser
from .serializers import (
    LLMSerializer,
    LLMResultSerializer,
    UnitTestSerializer,
    LLMUserSerializer,
    UserSerializer,
)

from rest_framework import permissions as drf_permissions
from rest_framework_simplejwt.views import (
    TokenObtainPairView as SimpleJWTTokenObtainPairView,
    TokenRefreshView as SimpleJWTTokenRefreshView,
)

User = get_user_model()


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class LLMViewSet(viewsets.ModelViewSet):
    queryset = LLM.objects.all()
    serializer_class = LLMSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Admin can create/update/delete; authenticated users can list/retrieve
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAdminUser],
        serializer_class=None,
    )
    def run_tests(self, request, pk=None):
        llm = self.get_object()
        # run_celery_task(llm)
        return Response(status=status.HTTP_202_ACCEPTED)


class LLMResultViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LLMResult.objects.all().order_by("-created_at")
    serializer_class = LLMResultSerializer
    permission_classes = [permissions.IsAuthenticated]


class UnitTestViewSet(viewsets.ModelViewSet):
    queryset = UnitTest.objects.all()
    serializer_class = UnitTestSerializer

    def get_permissions(self):
        # Only admin can CRUD tests
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class LLMUserViewSet(viewsets.ModelViewSet):
    queryset = LLMUser.objects.all()
    serializer_class = LLMUserSerializer

    def get_permissions(self):
        # Users can create/get their own tokens; admin can manage
        if self.request.user.is_staff:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        # Admin can list/create/destroy; regular authenticated users can retrieve/update their own profile
        if self.action in ["list", "create", "destroy"]:
            return [permissions.IsAdminUser()]
        return [IsAdminOrSelf()]


class IsAdminOrSelf(permissions.BasePermission):
    """Allow admin full access; non-admins can retrieve/update only their own user object."""

    def has_permission(self, request, view):
        # Allow admins to do anything; non-admins must be authenticated for non-admin actions
        if request.user and request.user.is_staff:
            return True
        # Disallow listing/creating/deleting for non-admins
        if view.action in ["list", "create", "destroy"]:
            return False
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return obj == request.user


class PublicTokenObtainPairView(SimpleJWTTokenObtainPairView):
    permission_classes = [drf_permissions.AllowAny]


class PublicTokenRefreshView(SimpleJWTTokenRefreshView):
    permission_classes = [drf_permissions.AllowAny]
