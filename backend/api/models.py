from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class LLM(models.Model):
    name = models.CharField(max_length=200)
    openai_link = models.URLField(blank=True, null=True)
    api_token = models.CharField(max_length=512, blank=True, null=True)

    def __str__(self):
        return self.name


class LLMResult(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('all', 'All'),
    ]

    llm = models.ForeignKey(LLM, on_delete=models.CASCADE, related_name='results')
    result = models.FloatField(help_text='Percentage 0..100')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='all')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.llm.name} {self.difficulty} {self.result}"


class UnitTest(models.Model):
    DIFFICULTY_CHOICES = LLMResult.DIFFICULTY_CHOICES

    name = models.CharField(max_length=300)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='all')
    prompt = models.TextField()
    tests = models.TextField(help_text='Python code that will be used as tests')

    def __str__(self):
        return self.name


class LLMUser(models.Model):
    llm = models.ForeignKey(LLM, on_delete=models.CASCADE, related_name='users')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=512)

    class Meta:
        unique_together = ('llm', 'user')

    def __str__(self):
        return f"{self.user.username} -> {self.llm.name}"
