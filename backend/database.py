import sqlite3


DB_NAME = "archmind.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def create_tables():
    connection = get_connection()
    cursor = connection.cursor()

    # Analyses table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation TEXT NOT NULL,
            summary TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Tasks table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            assignee TEXT,
            deadline TEXT,
            source_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (analysis_id) REFERENCES analyses(id)
        )
        """
    )

    # Decisions table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            status TEXT,
            decided_by TEXT,
            source_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (analysis_id) REFERENCES analyses(id)
        )
        """
    )

    connection.commit()
    connection.close()


def save_analysis(conversation: str, summary: str):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO analyses (conversation, summary)
        VALUES (?, ?)
        """,
        (conversation, summary)
    )

    analysis_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return analysis_id


def save_tasks(analysis_id: int, tasks: list):
    connection = get_connection()
    cursor = connection.cursor()

    for task in tasks:
        cursor.execute(
            """
            INSERT INTO tasks (
                analysis_id,
                title,
                assignee,
                deadline,
                source_text
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                task.get("title"),
                task.get("assignee"),
                task.get("deadline"),
                task.get("source_text")
            )
        )

    connection.commit()
    connection.close()


def save_decisions(analysis_id: int, decisions: list):
    connection = get_connection()
    cursor = connection.cursor()

    for decision in decisions:
        cursor.execute(
            """
            INSERT INTO decisions (
                analysis_id,
                title,
                status,
                decided_by,
                source_text
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                decision.get("title"),
                decision.get("status"),
                decision.get("decided_by"),
                decision.get("source_text")
            )
        )

    connection.commit()
    connection.close()


def get_analyses():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, conversation, summary, created_at
        FROM analyses
        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()
    connection.close()

    return [
        {
            "id": row[0],
            "conversation": row[1],
            "summary": row[2],
            "created_at": row[3]
        }
        for row in rows
    ]


def search_analyses(query: str):
    connection = get_connection()
    cursor = connection.cursor()

    search_term = f"%{query}%"

    cursor.execute(
        """
        SELECT id, conversation, summary, created_at
        FROM analyses
        WHERE conversation LIKE ?
           OR summary LIKE ?
        ORDER BY id DESC
        """,
        (search_term, search_term)
    )

    rows = cursor.fetchall()
    connection.close()

    return [
        {
            "id": row[0],
            "conversation": row[1],
            "summary": row[2],
            "created_at": row[3]
        }
        for row in rows
    ]


def get_tasks():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            analysis_id,
            title,
            assignee,
            deadline,
            source_text,
            created_at
        FROM tasks
        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()
    connection.close()

    return [
        {
            "id": row[0],
            "analysis_id": row[1],
            "title": row[2],
            "assignee": row[3],
            "deadline": row[4],
            "source_text": row[5],
            "created_at": row[6]
        }
        for row in rows
    ]


def get_decisions():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            analysis_id,
            title,
            status,
            decided_by,
            source_text,
            created_at
        FROM decisions
        ORDER BY id DESC
        """
    )

    rows = cursor.fetchall()
    connection.close()

    return [
        {
            "id": row[0],
            "analysis_id": row[1],
            "title": row[2],
            "status": row[3],
            "decided_by": row[4],
            "source_text": row[5],
            "created_at": row[6]
        }
        for row in rows
    ]