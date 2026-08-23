from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas


def create_sample_pdf(path: Path) -> Path:
    canvas = Canvas(str(path), pagesize=letter, invariant=1, pageCompression=0)
    width, height = letter
    for page_number in range(1, 4):
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(72, height - 30, "PRISM golden PDF fixture")
        canvas.setFont("Helvetica-Bold", 18)
        canvas.drawString(72, height - 92, f"{page_number}. TCP Slow Start")
        canvas.setFont("Times-Roman", 12)
        lines = [
            "TCP begins with a small congestion window because the sender does not yet know "
            "the path capacity.",
            "Each acknowledged round increases the amount of data in flight, so growth is "
            "initially exponential.",
            "When loss occurs, the sender reduces the window and records a threshold for later "
            "additive increase.",
            "However, a timeout does not prove that every packet was lost; it is a conservative "
            "congestion signal.",
        ]
        y = height - 132
        for line in lines:
            canvas.drawString(72, y, line)
            y -= 28
        if page_number == 2:
            canvas.setLineWidth(1.5)
            canvas.rect(130, 270, 350, 180)
            canvas.line(165, 305, 440, 410)
            canvas.circle(165, 305, 5, fill=1)
            canvas.circle(440, 410, 5, fill=1)
            canvas.setFont("Helvetica", 9)
            canvas.drawString(
                150, 250, "Figure 1.1.: Congestion window growth across acknowledged rounds."
            )
        if page_number == 3:
            canvas.setFont("Helvetica", 9)
            canvas.drawString(130, 450, "Table 1.1.: Window behavior by signal.")
            canvas.rect(130, 330, 350, 100)
            canvas.line(305, 330, 305, 430)
            canvas.line(130, 380, 480, 380)
            canvas.drawString(145, 405, "Signal")
            canvas.drawString(320, 405, "Window response")
            canvas.drawString(145, 350, "Timeout")
            canvas.drawString(320, 350, "Reset and restart")
        canvas.setFont("Helvetica", 9)
        canvas.drawCentredString(width / 2, 24, str(page_number))
        canvas.showPage()
    canvas.save()
    return path


@pytest.fixture
def sample_pdf(tmp_path: Path) -> Iterator[Path]:
    path = create_sample_pdf(tmp_path / "tcp-slow-start-fixture.pdf")
    yield path
