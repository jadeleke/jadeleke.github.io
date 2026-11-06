"""Generate the current two-page CV from the website's verified profile content.

Requires reportlab and pypdf. Run from any directory: python scripts/build_resume.py
For Python 3.9, reportlab 4.2.5 is compatible with this build.
The existing historical CV files are preserved.
"""
from datetime import date
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, HRFlowable,
)
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "assets" / "Joseph-Adeleke-current.pdf"
UPDATED = date(2026, 11, 6)


def clean(value):
    value = value.replace("\u2013", "-").replace("\u2014", "-")
    value = value.replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    value = value.replace("\u2022", " | ").replace("\u00a0", " ")
    return re.sub(r"\s+", " ", value).strip()


class Node:
    def __init__(self, tag="root", attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def text(self):
        return clean(" ".join(child.text() if isinstance(child, Node) else child for child in self.children))

    def descendants(self, tag=None, cls=None):
        found = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get("class", "").split()):
                    found.append(child)
                found.extend(child.descendants(tag, cls))
        return found

    def by_id(self, name):
        return next(node for node in self.descendants() if node.attrs.get("id") == name)


class Tree(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self, path):
        super().__init__()
        self.root, self.stack = Node(), []
        self.stack = [self.root]
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def fonts():
    # Use installed fonts when available; standard PDF fonts keep the build portable.
    win = Path("C:/Windows/Fonts")
    choices = {"Body": ("arial.ttf", "Helvetica"), "BodyBold": ("arialbd.ttf", "Helvetica-Bold"),
               "Display": ("georgia.ttf", "Times-Roman"), "Mono": ("consola.ttf", "Courier")}
    selected = {}
    for name, (filename, fallback) in choices.items():
        if (win / filename).exists():
            pdfmetrics.registerFont(TTFont(name, str(win / filename)))
            selected[name] = name
        else:
            selected[name] = fallback
    return selected


def build():
    resume = Tree(ROOT / "resume.html").root
    experience = Tree(ROOT / "experience.html").root
    research = Tree(ROOT / "research.html").root
    summary = resume.by_id("summary")
    roles = resume.by_id("experience").descendants(cls="timeline-item")
    education = resume.by_id("education").descendants(cls="timeline-item")
    skills = [node.text() for node in resume.by_id("skills").descendants(cls="resume-pill")]
    projects = json.loads((ROOT / "data" / "featured.json").read_text(encoding="utf-8"))
    projects = [next(p for p in projects if p["title"] == title) for title in ["OpenMed MLOps", "terraform-docker-nginx-app"]]
    interests = research.descendants(cls="research-interests")
    interests = [node.text() for group in interests for node in group.descendants("li")]
    assert len(roles) == 3 and len(education) == 3 and len(interests) == 10
    assert "Database Administrator" in summary.text() and "PhD" in education[0].text()

    f = fonts()
    ink, green, muted = colors.HexColor("#1c3029"), colors.HexColor("#34634e"), colors.HexColor("#59665e")
    paper, rule = colors.HexColor("#f5f3ed"), colors.HexColor("#d5dacf")
    styles = {
        "label": ParagraphStyle("label", fontName=f["Mono"], fontSize=7.3, leading=10.5, textColor=green, spaceAfter=8),
        "name": ParagraphStyle("name", fontName=f["Display"], fontSize=35, leading=40, textColor=ink, spaceAfter=9),
        "title": ParagraphStyle("title", fontName=f["Display"], fontSize=28, leading=32, textColor=ink, spaceAfter=12),
        "section": ParagraphStyle("section", fontName=f["Display"], fontSize=19, leading=23, textColor=ink, spaceAfter=7),
        "role": ParagraphStyle("role", fontName=f["BodyBold"], fontSize=10.3, leading=14.5, textColor=ink, spaceAfter=4),
        "body": ParagraphStyle("body", fontName=f["Body"], fontSize=9.3, leading=14.2, textColor=muted, spaceAfter=8),
        "small": ParagraphStyle("small", fontName=f["Body"], fontSize=8.2, leading=12.1, textColor=muted, spaceAfter=5),
        "meta": ParagraphStyle("meta", fontName=f["Mono"], fontSize=7.2, leading=10.5, textColor=green, spaceAfter=6),
        "bullet": ParagraphStyle("bullet", fontName=f["Body"], fontSize=9, leading=13.4, textColor=muted, leftIndent=10, firstLineIndent=-10, spaceAfter=5),
    }

    def p(text, style="body"):
        return Paragraph(escape(clean(text)), styles[style])

    def link(url, label, style="small"):
        return Paragraph(f'<link href="{escape(url, quote=True)}" color="#34634e">{escape(label)}</link>', styles[style])

    def heading(label):
        return [Spacer(1, 10), p(label, "section"), HRFlowable(width="100%", thickness=.5, color=rule, spaceAfter=9)]

    story = [p("RESEARCH & ENGINEERING / CURRENT PROFILE", "label"), p("Joseph Adeleke", "name"),
             p("DevSecOps & MLOps Engineer | Database Administrator", "role"),
             p("PhD student in Computer Science | Accra, Ghana", "body")]
    contact = Table([
        [link("mailto:akdeljoseph@outlook.com", "akdeljoseph@outlook.com"), link("https://jadeleke.github.io/", "jadeleke.github.io")],
        [link("https://github.com/jadeleke", "GitHub: @jadeleke"), link("https://www.linkedin.com/in/joseph-adeleke-msc-27b433149/", "LinkedIn: Joseph Adeleke")],
    ], colWidths=[250, 249])
    contact.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    story += [contact, Spacer(1, 11), HRFlowable(width="100%", thickness=.7, color=rule, spaceAfter=18), p(summary.descendants("p")[0].text())]
    story += heading("Professional experience")
    for role in roles:
        block = [p(role.descendants("h3")[0].text(), "role"), p(role.descendants("span")[0].text(), "meta")]
        block += [p(node.text()) for node in role.descendants("p")]
        block += [Spacer(1, 11)]
        story.append(KeepTogether(block))
    story += heading("Systems practice")
    # These are existing capability headings, not new role-specific achievements.
    capabilities = [node for node in experience.descendants("article", "card") if node.descendants("h2")]
    for cap in capabilities:
        title = cap.descendants("h2")[0].text()
        if title in {"Oracle DBA expertise", "Linux systems operations"}:
            story.append(p(title, "role"))
            items = cap.descendants("li")
            story.append(p(" ".join(item.text() for item in items[:2]), "small"))
    story += heading("Core tooling")
    story.append(p(" | ".join(skills), "small"))
    story += [PageBreak(), p("JOSEPH ADELEKE / RESEARCH & FOUNDATIONS", "label"), p("Research & foundations", "title")]
    story += [p("Cloud Computing and Distributed Systems", "role"),
              p("Uncertainty-Aware Workflow Scheduling, Statistical Risk Control, and Cloud Resource Optimisation", "body"),
              p("Research interests and direction", "meta"),
              p("My research interests connect cloud computing, distributed systems, statistical learning, and optimisation. I am interested in reliable, cost-efficient workflow scheduling under uncertain execution conditions, combining mathematical modelling, statistical methods, and experimental systems evaluation.")]
    # Six compact thematic lines retain the full direction without implying completed contributions.
    for text in ["Scientific workflow and DAG-based task scheduling; deadlines and cost efficiency.",
                 "Uncertainty quantification, runtime uncertainty, model misspecification, and performance modelling.",
                 "Distribution-free statistical risk control and conformal prediction.",
                 "Resource allocation, admission control, queueing, and service reliability.",
                 "Reliable cloud systems and applied ML for resource management."]:
        story.append(p("- " + text, "bullet"))
    story += heading("Education")
    for entry in education:
        block = [p(entry.descendants("h3")[0].text(), "role"), p(entry.descendants("span")[0].text(), "meta")]
        if entry.descendants("p"):
            block.append(p(entry.descendants("p")[0].text(), "small"))
        block.append(Spacer(1, 6))
        story.append(KeepTogether(block))
    story += heading("Selected projects")
    for project in projects:
        title = "Infrastructure as code" if project["title"] == "terraform-docker-nginx-app" else project["title"]
        story.append(KeepTogether([p(title, "role"), p(project["description"], "small"), link(project["repo"], project["repo"].removeprefix("https://")), Spacer(1, 6)]))

    def page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(paper)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        canvas.setStrokeColor(rule)
        canvas.setLineWidth(.5)
        canvas.line(48, 39, A4[0] - 48, 39)
        canvas.setFont(f["Mono"], 6.6)
        canvas.setFillColor(muted)
        canvas.drawString(48, 26, "JOSEPH ADELEKE | jadeleke.github.io")
        canvas.drawRightString(A4[0] - 48, 26, f"Updated {UPDATED.isoformat()}  /  {doc.page}")
        canvas.restoreState()

    OUTPUT.parent.mkdir(exist_ok=True)
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=48, leftMargin=48,
                            topMargin=45, bottomMargin=53, title="Joseph Adeleke - Current CV",
                            author="Joseph Adeleke", subject="Research interests, education, and professional experience")
    doc.build(story, onFirstPage=page, onLaterPages=page)
    reader = PdfReader(OUTPUT)
    if len(reader.pages) != 2:
        raise RuntimeError("The CV must remain two pages; review and repaginate after content changes.")
    pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    for phrase in ("PhD student", "Database Administrator", "In progress", "OpenMed MLOps"):
        if phrase not in pdf_text:
            raise RuntimeError(f"The generated CV is missing required current profile text: {phrase}")
    print(OUTPUT)


if __name__ == "__main__":
    build()
