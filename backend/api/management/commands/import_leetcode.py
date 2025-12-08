import json
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import UnitTest


class Command(BaseCommand):
    help = 'Import LeetCodeDataset JSONL into UnitTest model'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to dataset.jsonl')
        parser.add_argument('--dry-run', action='store_true', help='Parse file but do not write to DB')
        parser.add_argument('--update', action='store_true', help='Use update_or_create by name instead of create')

    def handle(self, *args, **options):
        path = options['file_path']
        dry_run = options['dry_run']
        update = options['update']

        processed = 0
        created = 0
        updated = 0

        self.stdout.write(f'Opening {path}...')

        with open(path, 'r', encoding='utf-8') as f:
            for lineno, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError as e:
                    self.stderr.write(f'Line {lineno}: JSON error: {e}')
                    continue

                # Map fields from dataset to UnitTest
                name = row.get('name') or row.get('title') or row.get('question_title') or row.get('id')
                difficulty = (row.get('difficulty') or 'all').lower()
                # Normalize difficulty
                if difficulty not in dict(UnitTest.DIFFICULTY_CHOICES).keys():
                    if 'easy' in difficulty:
                        difficulty = 'easy'
                    elif 'medium' in difficulty:
                        difficulty = 'medium'
                    elif 'hard' in difficulty:
                        difficulty = 'hard'
                    else:
                        difficulty = 'all'

                prompt = row.get('prompt') or row.get('content') or row.get('description') or ''
                tests = row.get('tests') or row.get('test') or row.get('code') or ''

                if not name:
                    self.stderr.write(f'Line {lineno}: missing name/title — skipping')
                    continue

                processed += 1

                if dry_run:
                    # show a summary line
                    self.stdout.write(f'[DRY] {name} ({difficulty})')
                    continue

                try:
                    with transaction.atomic():
                        if update:
                            obj, was_created = UnitTest.objects.update_or_create(
                                name=name,
                                defaults={'difficulty': difficulty, 'prompt': prompt, 'tests': tests}
                            )
                            if was_created:
                                created += 1
                            else:
                                updated += 1
                        else:
                            # create, skip duplicates by name
                            if UnitTest.objects.filter(name=name).exists():
                                self.stdout.write(f'Line {lineno}: already exists: {name} — skipping')
                                continue
                            UnitTest.objects.create(name=name, difficulty=difficulty, prompt=prompt, tests=tests)
                            created += 1
                except Exception as e:
                    self.stderr.write(f'Line {lineno}: DB error: {e}')

        self.stdout.write(self.style.SUCCESS(f'Processed {processed} lines — created: {created}, updated: {updated}'))
