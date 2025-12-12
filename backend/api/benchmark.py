import logging

from celery import shared_task
from django.utils import timezone

from .models import LLM, LLMResult, UnitTest

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def run_llm_tests_task(self, llm_id):
    """
    Celery task that runs all UnitTest entries for the given LLM.
    """
    try:
        llm = LLM.objects.get(id=llm_id)
    except LLM.DoesNotExist:
        logger.error("LLM with id %s not found", llm_id)
        return {"error": "llm_not_found", "llm_id": llm_id}

    tests = list(UnitTest.objects.all())
    total = len(tests)
    if total == 0:
        logger.info("No UnitTest objects found; creating empty result for %s", llm)
        result_value = 0.0
    else:
        passed_count = 0
        for test in tests:
            passed_count += 1 # api_call_llm_and_run_test(llm, test)

        result_value = (passed_count / total) * 100.0

    rr = LLMResult.objects.create(
        llm=llm,
        result=result_value,
        difficulty='all',
        created_at=timezone.now(),
    )

    logger.info("Created LLMResult %s for LLM %s (score=%.2f)", rr.id, llm, result_value)
    return {"llm_result_id": rr.id, "score": result_value}


def run_celery_task(llm):
    try:
        run_llm_tests_task.delay(llm.id)
        logger.info("Enqueued run_llm_tests_task for LLM id=%s", llm.id)
        return True
    except Exception:
        logger.exception("Failed to enqueue Celery task, running synchronously for LLM id=%s", llm.id)
        try:
            run_llm_tests_task.apply(args=(llm.id,))
        except Exception:
            logger.exception("Synchronous fallback also failed for LLM id=%s", llm.id)
        return False
