from django.contrib import admin
from .models import LLM, LLMResult, UnitTest, LLMUser


@admin.register(LLM)
class LLMAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'openai_link')


@admin.register(LLMResult)
class LLMResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'llm', 'difficulty', 'result', 'created_at')
    list_filter = ('difficulty', 'created_at')


@admin.register(UnitTest)
class UnitTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'difficulty')


@admin.register(LLMUser)
class LLMUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'llm', 'user')
