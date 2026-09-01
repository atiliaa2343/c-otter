"""Generates the downloadable Doughnut's Jam Coloring Book PDF from the source
artwork and the same text overlays used in app/coloring.tsx, and writes it to
assets/Doughnuts_Jam_Coloring_Book.pdf. Every page is rendered at the same
canvas size so each page fills the entire PDF page (no borders/letterboxing).
"""
import os
import textwrap

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(ROOT, "assets", "images")
OUTPUT_PATH = os.path.join(ROOT, "assets", "Doughnuts_Jam_Coloring_Book.pdf")

PAGE_W, PAGE_H = 2689, 3861  # matches the coloring artwork's native resolution
CREAM_BG = (255, 255, 255)
BOX_BG = (255, 255, 255)
BOX_TEXT_COLOR = (51, 51, 51)
TITLE_COLOR = (0, 0, 0)

FONTS_DIR = "/System/Library/Fonts/Supplemental"
FONT_BOLD = os.path.join(FONTS_DIR, "Arial Bold.ttf")
FONT_BOLD_ITALIC = os.path.join(FONTS_DIR, "Arial Bold Italic.ttf")
FONT_ITALIC = os.path.join(FONTS_DIR, "Arial Italic.ttf")
FONT_REGULAR = os.path.join(FONTS_DIR, "Arial.ttf")


def font(path, size):
    return ImageFont.truetype(path, size)


def new_page(bg=CREAM_BG):
    return Image.new("RGB", (PAGE_W, PAGE_H), bg)


def whiten_like_app(img):
    """Mirrors the app's canvasImage filter: brightness(2) saturate(0)."""
    gray = img.convert("L")
    brightened = gray.point(lambda x: min(255, x * 2))
    return Image.merge("RGB", (brightened, brightened, brightened))


def fixed_text_box(img, text, rect, font_size=34, align="left", valign="middle",
                    radius=32, padding=36):
    """Draws a text box at an exact pixel rect (rather than sizing the box to
    fit the text). Used where the box needs to fully cover a region of the
    underlying artwork regardless of how much text is inside it."""
    left, top, right, bottom = rect
    draw = ImageDraw.Draw(img)
    rounded_box(draw, rect, radius=radius)
    fnt = font(FONT_ITALIC, font_size)
    inner_left, inner_right = left + padding, right - padding
    inner_top, inner_bottom = top + padding, bottom - padding

    words = text.replace("\n", " \n ").split(" ")
    lines, current = [], ""
    for word in words:
        if word == "\n":
            lines.append(current)
            current = ""
            continue
        trial = (current + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= (inner_right - inner_left):
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    line_height = int(font_size * 1.3)
    text_height = line_height * len(lines)
    y = inner_top + max(0, ((inner_bottom - inner_top) - text_height) / 2) if valign == "middle" else inner_top
    for line in lines:
        line_w = draw.textlength(line, font=fnt)
        x = inner_left + (inner_right - inner_left - line_w) / 2 if align == "center" else inner_left
        draw.text((x, y), line, font=fnt, fill=BOX_TEXT_COLOR)
        y += line_height


def draw_wrapped_text(draw, text, box, fnt, color, align="left", line_spacing=1.3):
    left, top, right, bottom = box
    max_width = right - left
    # Wrap text to fit max_width using actual glyph measurements
    words = text.split(" ")
    lines, current = [], ""
    for word in words:
        trial = (current + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    line_height = int(fnt.size * line_spacing)
    y = top
    for line in lines:
        line_w = draw.textlength(line, font=fnt)
        if align == "center":
            x = left + (max_width - line_w) / 2
        else:
            x = left
        draw.text((x, y), line, font=fnt, fill=color)
        y += line_height
    return y  # bottom y after the last line


def rounded_box(draw, box, radius=24, fill=BOX_BG):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def text_box(img, text, top=None, bottom=None, left=None, right=None,
             font_size=34, align="left", radius=24, padding=24):
    draw = ImageDraw.Draw(img)
    fnt = font(FONT_ITALIC, font_size)
    left_px = left if left is not None else 0
    right_px = (PAGE_W - right) if right is not None else PAGE_W
    inner_left, inner_right = left_px + padding, right_px - padding

    # Measure wrapped text height first so the box can hug the text
    words = text.replace("\n", " \n ").split(" ")
    lines, current = [], ""
    for word in words:
        if word == "\n":
            lines.append(current)
            current = ""
            continue
        trial = (current + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= (inner_right - inner_left):
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    line_height = int(font_size * 1.3)
    text_height = line_height * len(lines)

    if top is not None:
        top_px = top
        bottom_px = top_px + text_height + padding * 2
    else:
        bottom_px = PAGE_H - bottom
        top_px = bottom_px - text_height - padding * 2

    rounded_box(draw, (left_px, top_px, right_px, bottom_px), radius=radius)
    draw_wrapped_text(
        draw, text.replace("\n", " "), (inner_left, top_px + padding, inner_right, bottom_px - padding),
        fnt, BOX_TEXT_COLOR, align=align,
    )


def draw_donut_pattern(img, cell_size=300, outline=(17, 17, 17)):
    draw = ImageDraw.Draw(img)
    outer_r = int(cell_size * 0.38)
    inner_r = int(cell_size * 0.14)
    fill = (255, 255, 255)
    cols = (PAGE_W // cell_size) + 2
    rows = (PAGE_H // cell_size) + 2
    for row in range(rows):
        for col in range(cols):
            cx = col * cell_size + cell_size // 2
            cy = row * cell_size + cell_size // 2
            draw.ellipse((cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r),
                         fill=fill, outline=outline, width=10)
            draw.ellipse((cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r),
                         fill=fill, outline=outline, width=7)
            dot_r, dot_bw = 12, 5
            offset = cell_size // 2
            for dx, dy in [(-offset + 30, -offset + 28), (offset - 55, -offset + 40),
                           (-offset + 50, offset - 50), (offset - 65, offset - 28)]:
                draw.ellipse((cx + dx, cy + dy, cx + dx + dot_r * 2, cy + dy + dot_r * 2),
                             fill=fill, outline=outline, width=dot_bw)


def draw_jelly_pattern(img, cell_size=300, outline=(17, 17, 17)):
    draw = ImageDraw.Draw(img)
    fill = (255, 255, 255)
    cols = (PAGE_W // cell_size) + 2
    rows = (PAGE_H // cell_size) + 2
    jar_w = int(cell_size * 0.41)   # 18/44
    jar_h = int(cell_size * 0.50)   # 22/44
    jar_r = int(cell_size * 0.14)   # 6/44
    lid_w = int(cell_size * 0.50)   # 22/44
    lid_h = int(cell_size * 0.18)   # 8/44
    lid_r = int(cell_size * 0.07)   # 3/44
    dot_r = int(cell_size * 0.05)
    for row in range(rows):
        for col in range(cols):
            cx = col * cell_size + cell_size // 2
            cy = row * cell_size + cell_size // 2
            jx = cx - jar_w // 2
            jy = cy - jar_h // 2
            # Jar body
            draw.rounded_rectangle((jx, jy, jx + jar_w, jy + jar_h),
                                   radius=jar_r, fill=fill, outline=outline, width=8)
            # Lid (sits above jar, slightly wider)
            lx = cx - lid_w // 2
            ly = jy - lid_h + 4
            draw.rounded_rectangle((lx, ly, lx + lid_w, ly + lid_h),
                                   radius=lid_r, fill=fill, outline=outline, width=6)
            # Seed dots
            for dx, dy in [(-cell_size // 2 + int(cell_size*0.20), -cell_size // 2 + int(cell_size*0.09)),
                           (cell_size // 2 - int(cell_size*0.25), -cell_size // 2 + int(cell_size*0.18)),
                           (-cell_size // 2 + int(cell_size*0.16), cell_size // 2 - int(cell_size*0.20)),
                           (cell_size // 2 - int(cell_size*0.29), cell_size // 2 - int(cell_size*0.16))]:
                draw.ellipse((cx + dx, cy + dy, cx + dx + dot_r * 2, cy + dy + dot_r * 2),
                             fill=fill, outline=outline, width=4)


def page_cover():
    # Matches the app's book cover: bookContainer -> bookCover -> coverDesign -> coverBorder -> coverInner
    OUTER_BG = (255, 255, 255)     # white
    COVER_BG = (139, 69, 19)       # #8B4513
    BORDER_BG = (245, 222, 179)    # #F5DEB3
    SUBTLE_LINE = (200, 178, 150)  # approximates rgba(0,0,0,0.1) over the tan tones
    SUBTITLE_COLOR = (160, 82, 45)  # #A0522D
    DONUT_OUTER = (255, 107, 107)  # #FF6B6B

    img = Image.new("RGB", (PAGE_W, PAGE_H), OUTER_BG)
    draw_donut_pattern(img)
    draw = ImageDraw.Draw(img)

    book_w = int(PAGE_W * 0.85)
    book_h = int(book_w / 0.75)
    if book_h > PAGE_H * 0.94:
        book_h = int(PAGE_H * 0.94)
        book_w = int(book_h * 0.75)
    bx, by = (PAGE_W - book_w) // 2, (PAGE_H - book_h) // 2
    draw.rounded_rectangle((bx, by, bx + book_w, by + book_h), radius=36, fill=COVER_BG)

    m1 = int(book_w * 0.035)
    design = (bx + m1, by + m1, bx + book_w - m1, by + book_h - m1)
    draw.rounded_rectangle(design, radius=28, fill=OUTER_BG)

    m2 = int(book_w * 0.025)
    border = (design[0] + m2, design[1] + m2, design[2] - m2, design[3] - m2)
    draw.rounded_rectangle(border, radius=18, fill=BORDER_BG, outline=SUBTLE_LINE, width=6)

    # Corner brackets, matching coverCornerTopLeft/TopRight/BottomLeft/BottomRight
    bl = int(book_w * 0.09)
    bw = 9
    inset = int(book_w * 0.045)
    tl, tr = (border[0] + inset, border[1] + inset), (border[2] - inset, border[1] + inset)
    bl_, br_ = (border[0] + inset, border[3] - inset), (border[2] - inset, border[3] - inset)
    draw.line([(tl[0], tl[1] + bl), (tl[0], tl[1]), (tl[0] + bl, tl[1])], fill=SUBTLE_LINE, width=bw)
    draw.line([(tr[0] - bl, tr[1]), (tr[0], tr[1]), (tr[0], tr[1] + bl)], fill=SUBTLE_LINE, width=bw)
    draw.line([(bl_[0], bl_[1] - bl), (bl_[0], bl_[1]), (bl_[0] + bl, bl_[1])], fill=SUBTLE_LINE, width=bw)
    draw.line([(br_[0] - bl, br_[1]), (br_[0], br_[1]), (br_[0], br_[1] - bl)], fill=SUBTLE_LINE, width=bw)

    cx = (border[0] + border[2]) // 2
    title_fnt = font(FONT_BOLD, int(book_w * 0.09))
    subtitle_fnt = font(FONT_BOLD_ITALIC, int(book_w * 0.095))
    title, subtitle = "Doughnut's Jam", "Coloring Book"
    title_y = border[1] + int((border[3] - border[1]) * 0.30)
    tw = draw.textlength(title, font=title_fnt)
    draw.text((cx - tw / 2, title_y), title, font=title_fnt, fill=TITLE_COLOR)
    sub_y = title_y + int(book_w * 0.16)
    sw = draw.textlength(subtitle, font=subtitle_fnt)
    draw.text((cx - sw / 2, sub_y), subtitle, font=subtitle_fnt, fill=SUBTITLE_COLOR)

    icon_y = sub_y + int(book_w * 0.22)
    r_outer, r_inner = int(book_w * 0.11), int(book_w * 0.055)
    draw.ellipse((cx - r_outer, icon_y - r_outer, cx + r_outer, icon_y + r_outer),
                 fill=DONUT_OUTER, outline=SUBTLE_LINE, width=6)
    draw.ellipse((cx - r_inner, icon_y - r_inner, cx + r_inner, icon_y + r_inner),
                 fill=BORDER_BG, outline=SUBTLE_LINE, width=4)
    return img


def page_from_image(filename, fit="cover"):
    src = Image.open(os.path.join(IMAGES_DIR, filename)).convert("RGB")
    src = whiten_like_app(src)
    img = new_page()
    src_ratio = src.width / src.height
    page_ratio = PAGE_W / PAGE_H
    if fit == "contain":
        if src_ratio > page_ratio:
            new_w = PAGE_W
            new_h = int(PAGE_W / src_ratio)
        else:
            new_h = PAGE_H
            new_w = int(PAGE_H * src_ratio)
        resized = src.resize((new_w, new_h), Image.LANCZOS)
        img.paste(resized, ((PAGE_W - new_w) // 2, (PAGE_H - new_h) // 2))
    else:  # cover - fills the whole page, cropping if needed
        if src_ratio > page_ratio:
            new_h = PAGE_H
            new_w = int(PAGE_H * src_ratio)
        else:
            new_w = PAGE_W
            new_h = int(PAGE_W / src_ratio)
        resized = src.resize((new_w, new_h), Image.LANCZOS)
        left = (new_w - PAGE_W) // 2
        top = (new_h - PAGE_H) // 2
        img.paste(resized.crop((left, top, left + PAGE_W, top + PAGE_H)), (0, 0))
    return img


def page_blurb1():
    img = page_from_image("Doughnut's Jam final pg 1 blurb1.jpg")
    # Box is sized to fully cover the artist's handwritten draft of this same
    # text, which is baked into the source artwork (rect measured directly
    # from the ink so no handwriting peeks out around the edges).
    fixed_text_box(
        img,
        "Doughnut Sinclair is a Jolly Jelly new hire, passionate about the fruity "
        "deliciousness of jelly. She is tasked with developing a new Jolly Jellicious "
        "recipe. Pressure from her supervisor makes her question how far her positivity "
        "and work ethic can take her in the jelly-making world.",
        rect=(540, 1980, 2280, 3380), font_size=58,
    )
    return img


def page_pg1():
    img = page_from_image("Doughnut's Jam final pg 1.jpg")
    draw = ImageDraw.Draw(img)
    # Fill speech bubble interior with white ellipse matching the hand-drawn bubble shape
    draw.ellipse((180, 170, 1300, 1000), fill=(255, 255, 255))
    fnt = font(FONT_ITALIC, 75)
    draw_wrapped_text(
        draw,
        "I don't know why they hired you! Now I'm stuck with your stupid ideas.",
        (340, 430, 1140, 880),
        fnt, BOX_TEXT_COLOR, align="left",
    )
    fixed_text_box(
        img, "Mr. Toast is fussing at me again!",
        rect=(1770, 3490, 2660, 3830), font_size=58, align="center",
    )
    return img


def page_pg2():
    img = page_from_image("Doughnut's Jam final pg 2.jpg")
    text_box(
        img, "I don't know if she has a problem with my",
        top=12, left=18, right=18, font_size=44, align="center",
    )
    text_box(
        img, "recipe or if she just doesn't like me",
        bottom=4, left=12, right=12, font_size=44, align="center",
    )
    return img


def page_pg3():
    img = page_from_image("Doughnut's Jam final pg3.jpg")
    fixed_text_box(
        img, "However...\nMy passion for jelly",
        rect=(1560, 0, 2660, 400), font_size=46,
    )
    fixed_text_box(
        img, "washes away the bitter\ntaste of inferiority.",
        rect=(0, 3430, 1080, 3850), font_size=46,
    )
    return img


def page_pg4():
    img = page_from_image("Doughnut's Jam final pg4.jpg")
    fixed_text_box(
        img, "With the overwhelming positivity from my jelly love",
        rect=(0, 0, PAGE_W, 330), font_size=44, align="center",
    )
    fixed_text_box(
        img, "I CAN overcome anything!!!",
        rect=(0, 3525, PAGE_W, PAGE_H), font_size=44, align="center",
    )
    return img


def page_notes():
    img = new_page()
    draw_jelly_pattern(img, outline=(17, 17, 17))
    draw = ImageDraw.Draw(img)
    card_x = int(PAGE_W * 0.05)
    card_y = int(PAGE_H * 0.06)
    draw.rounded_rectangle((card_x, card_y, PAGE_W - card_x, PAGE_H - card_y),
                           radius=60, fill=(255, 255, 255))
    margin = int(PAGE_W * 0.08)
    title_fnt = font(FONT_BOLD, 80)
    body_fnt = font(FONT_REGULAR, 52)

    y = int(PAGE_H * 0.10)
    title1 = "Artist Note (Ayanna Reid)"
    tw = draw.textlength(title1, font=title_fnt)
    draw.text(((PAGE_W - tw) / 2, y), title1, font=title_fnt, fill=TITLE_COLOR)
    y += 110

    body1 = (
        "On the importance of art in the healing process: \"Within healing, art isn't "
        "only a tool for managing attention and regulating emotions. Art provides "
        "situational control where one can interact and engage with it for whatever "
        "desired purpose. The healing that occurs within art grows from the ability to "
        "fully represent yourself within your work. The workplace comes as a rigid, "
        "structured environment with strict expectations of our behaviors and "
        "responses. My goal for this coloring book was to offset the monotonous work "
        "environment with a silly, quirky story about a jelly-worker experiencing "
        "common problems that occur within the workplace.\""
    )
    y = draw_wrapped_text(draw, body1, (margin, y, PAGE_W - margin, PAGE_H), body_fnt, BOX_TEXT_COLOR, align="center")
    y += 90

    title2 = "Note from Ce. OTTER"
    tw = draw.textlength(title2, font=title_fnt)
    draw.text(((PAGE_W - tw) / 2, y), title2, font=title_fnt, fill=TITLE_COLOR)
    y += 110

    body2 = (
        "The Center for Outreach & Treatment Through Education & Research is commited "
        "to providing community engagement, health education, medical services, and "
        "biomedical research training in the fields of Addiction, Public Health, "
        "Psychology, and other related fields to faculty, staff, students, and "
        "community stakeholders. Through the integration of education and research, "
        "the Ce OTTER will help establish VSU as a health hub for surrounding "
        "communities. The coloring book will be located on the Ce. Otter app, the app "
        "will be available for download on the Apple and Google Play Store fall 2026."
    )
    draw_wrapped_text(draw, body2, (margin, y, PAGE_W - margin, PAGE_H), body_fnt, BOX_TEXT_COLOR, align="center")
    return img


def page_resources():
    img = new_page()
    draw_donut_pattern(img, outline=(17, 17, 17))
    draw = ImageDraw.Draw(img)
    card_x = int(PAGE_W * 0.05)
    card_y = int(PAGE_H * 0.06)
    draw.rounded_rectangle((card_x, card_y, PAGE_W - card_x, PAGE_H - card_y),
                           radius=60, fill=(255, 255, 255))
    margin = int(PAGE_W * 0.08)
    title_fnt = font(FONT_BOLD, 72)
    body_fnt = font(FONT_REGULAR, 50)

    y = int(PAGE_H * 0.08)
    title = "Virginia Department of Health-Crater Health District"
    draw_wrapped_text(draw, title, (margin, y, PAGE_W - margin, PAGE_H), title_fnt, TITLE_COLOR, align="center", line_spacing=1.2)
    y += 280

    qr = Image.open(os.path.join(IMAGES_DIR, "Crater Webpage QR.png")).convert("RGB")
    qr_size = 900
    qr = qr.resize((qr_size, qr_size), Image.LANCZOS)
    img.paste(qr, ((PAGE_W - qr_size) // 2, y))
    y += qr_size + 80

    body1 = (
        "Doughnut's Jam coloring book was funded by the American Rescue Plan Act "
        "(ARPA) Targeted Community Outreach grant awarded to the Virginia Department "
        "of Health. This community resource was developed in partnership with the "
        "Virginia Department of Health–Crater Health District, Arts As Healing "
        "Project."
    )
    y = draw_wrapped_text(draw, body1, (margin, y, PAGE_W - margin, PAGE_H), body_fnt, BOX_TEXT_COLOR, align="center")
    y += 60

    body2 = (
        "The Crater Health District offers a variety of services across multiple "
        "programs including Environmental Health, Population Health, Epidemiology and "
        "Clinical Services dedicated to promoting, strengthening, and maintaining "
        "community health and wellness. For more information, please visit the Crater "
        "Health District website at https://www.vdh.virginia.gov/crater or contact the "
        "main office at 804-863-1652."
    )
    draw_wrapped_text(draw, body2, (margin, y, PAGE_W - margin, PAGE_H), body_fnt, BOX_TEXT_COLOR, align="center")
    return img


def main():
    pages = [
        page_cover(),
        page_blurb1(),
        page_pg1(),
        page_pg2(),
        page_pg3(),
        page_pg4(),
        page_notes(),
        page_resources(),
    ]
    pages[0].save(OUTPUT_PATH, save_all=True, append_images=pages[1:])
    print(f"Saved {len(pages)}-page PDF to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
