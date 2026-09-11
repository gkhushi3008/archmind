import re


TASK_PATTERNS = [
    r"\bi will\b",
    r"\bi'll\b",
    r"\bwe will\b",
    r"\bplease\b",
    r"\bneed to\b",
    r"\bneeds to\b",
    r"\bmust\b",
    r"\bshould\b",
    r"\bcan you\b",
    r"\bcould you\b",
    r"\bwill send\b",
    r"\bwill submit\b",
    r"\bwill prepare\b",
    r"\bwill update\b",
    r"\bwill finish\b",
    r"\bwill review\b",
    r"\bwill check\b",
    r"\bwill complete\b",
    r"\bwill share\b",
    r"\bwill provide\b",
    r"\bwill deliver\b",
    r"\bsubmit\b",
    r"\bprepare\b",
    r"\bupdate\b",
    r"\bfinish\b",
    r"\bcomplete\b",
]

DECISION_PATTERNS = [
    r"\bapproved\b",
    r"\bapprove\b",
    r"\bconfirmed\b",
    r"\bconfirm\b",
    r"\bdecided\b",
    r"\bdecision\b",
    r"\bagreed\b",
    r"\bagree\b",
    r"\bselected\b",
    r"\bchosen\b",
    r"\bfinalized\b",
    r"\baccepted\b",
]

PENDING_PATTERNS = [
    r"\bpending\b",
    r"\bwaiting\b",
    r"\bawaiting\b",
    r"\bunder review\b",
    r"\bnot approved\b",
    r"\bneeds approval\b",
    r"\bwaiting for approval\b",
    r"\bto be confirmed\b",
    r"\bnot confirmed\b",
    r"\byet to be decided\b",
    r"\bopen item\b",
]

WEEKDAY_PATTERN = (
    r"\b(monday|tuesday|wednesday|thursday|friday|"
    r"saturday|sunday|today|tomorrow)\b"
)


def get_speaker(line: str):
    if ":" in line:
        return line.split(":", 1)[0].strip()

    return None


def get_message(line: str):
    if ":" in line:
        return line.split(":", 1)[1].strip()

    return line.strip()


def detect_deadline(text: str):
    lower = text.lower()

    weekday_match = re.search(WEEKDAY_PATTERN, lower)

    if weekday_match:
        return weekday_match.group(1).title()

    date_patterns = [
        r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",
        r"\b\d{1,2}-\d{1,2}-\d{2,4}\b",
        r"\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b",
        r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b",
    ]

    for pattern in date_patterns:
        match = re.search(pattern, lower)

        if match:
            return match.group(0).title()

    relative_match = re.search(
        r"\b(by|before|within)\s+(\d+)\s+(day|days|week|weeks)\b",
        lower
    )

    if relative_match:
        return relative_match.group(0).title()

    return None


def detect_assignee(line: str):
    speaker = get_speaker(line)
    message = get_message(line)
    lower = message.lower()

    if speaker and (
        "i will" in lower
        or "i'll" in lower
        or "i can" in lower
        or "i need to" in lower
    ):
        return speaker

    # Example:
    # "John needs to update the budget."
    name_match = re.match(
        r"^([A-Z][a-zA-Z]+)\s+(needs to|will|must|should)\b",
        message
    )

    if name_match:
        return name_match.group(1)

    return None


def matches_any_pattern(text: str, patterns: list[str]):
    lower = text.lower()

    return any(
        re.search(pattern, lower)
        for pattern in patterns
    )


def is_pending(text: str):
    return matches_any_pattern(
        text,
        PENDING_PATTERNS
    )


def is_decision(text: str):
    if is_pending(text):
        return False

    return matches_any_pattern(
        text,
        DECISION_PATTERNS
    )


def is_task(text: str):
    return matches_any_pattern(
        text,
        TASK_PATTERNS
    )


def analyze_with_ai(conversation: str):
    text = conversation.strip()

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    tasks = []
    decisions = []
    pending_decisions = []
    key_points = []

    seen_tasks = set()
    seen_decisions = set()
    seen_pending = set()
    seen_key_points = set()

    for line in lines:
        speaker = get_speaker(line)
        message = get_message(line)

        # -----------------------------------------
        # PENDING DECISIONS
        # -----------------------------------------

        if is_pending(line):
            key = message.lower()

            if key not in seen_pending:
                pending_decisions.append({
                    "title": message,
                    "source_text": line
                })

                seen_pending.add(key)

            if line not in seen_key_points:
                key_points.append(line)
                seen_key_points.add(line)

        # -----------------------------------------
        # CONFIRMED DECISIONS
        # -----------------------------------------

        elif is_decision(line):
            key = message.lower()

            if key not in seen_decisions:
                decisions.append({
                    "title": message,
                    "status": "approved",
                    "decided_by": speaker,
                    "source_text": line
                })

                seen_decisions.add(key)

            if line not in seen_key_points:
                key_points.append(line)
                seen_key_points.add(line)

        # -----------------------------------------
        # TASKS
        # -----------------------------------------

        if is_task(line):
            key = message.lower()

            if key not in seen_tasks:
                tasks.append({
                    "title": message,
                    "assignee": detect_assignee(line),
                    "deadline": detect_deadline(line),
                    "source_text": line
                })

                seen_tasks.add(key)

            if line not in seen_key_points:
                key_points.append(line)
                seen_key_points.add(line)

    # -----------------------------------------
    # SUMMARY
    # -----------------------------------------

    summary_parts = []

    if decisions:
        summary_parts.append(
            f"{len(decisions)} confirmed decision(s)"
        )

    if tasks:
        summary_parts.append(
            f"{len(tasks)} task(s)"
        )

    if pending_decisions:
        summary_parts.append(
            f"{len(pending_decisions)} pending item(s)"
        )

    if summary_parts:
        summary = (
            "The conversation contains "
            + ", ".join(summary_parts)
            + "."
        )
    else:
        summary = (
            "No clear tasks, decisions, or pending items were detected."
        )

    return {
        "summary": summary,
        "tasks": tasks,
        "decisions": decisions,
        "pending_decisions": pending_decisions,
        "key_points": key_points
    }