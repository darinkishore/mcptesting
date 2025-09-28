import asyncio
import uuid

from backend.main import (
    ScanInclude,
    ScanJob,
    ScanRequest,
    _run_scan_job,
    jobs,
    jobs_lock,
)

SERVER_URL = "https://mcp.linear.app/mcp"


async def run_manual_job() -> ScanJob:
    request = ScanRequest(
        server_url=SERVER_URL,
        include=ScanInclude(mcpScan=True, mcpValidator=True),
        oauth_scopes="offline_access",
        timeout_seconds=45,
    )

    job_id = uuid.uuid4().hex
    job = ScanJob(job_id=job_id, request=request)

    async with jobs_lock:
        jobs[job_id] = job

    await _run_scan_job(job_id)

    async with jobs_lock:
        jobs.pop(job_id, None)

    return job


def main():
    job = asyncio.run(run_manual_job())
    print("Job status:", job.status)
    if job.error:
        print("Error:", job.error)
    if job.result:
        lint = job.result.get("securityLint")
        if lint:
            print("Score:", lint["score"])
            print("Total checks:", lint["totalChecks"])
            print("Providers:", job.result.get("providers"))
            print("Artifacts:", job.artifacts)


if __name__ == "__main__":
    main()
