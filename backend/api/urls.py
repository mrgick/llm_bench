from rest_framework import routers
from django.urls import path, include
from .views import (
    LLMViewSet,
    LLMResultViewSet,
    UnitTestViewSet,
    LLMUserViewSet,
    UserViewSet,
)

router = routers.DefaultRouter()
router.register(r'llms', LLMViewSet, basename='llm')
router.register(r'llm-results', LLMResultViewSet, basename='llmresult')
router.register(r'unit-tests', UnitTestViewSet, basename='unittest')
router.register(r'llm-users', LLMUserViewSet, basename='llmuser')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]
