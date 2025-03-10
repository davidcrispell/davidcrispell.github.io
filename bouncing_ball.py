import pygame
import sys
import random
import math

# Initialize pygame
pygame.init()

# Screen settings
WIDTH, HEIGHT = 400, 400
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Timing Trainer")
clock = pygame.time.Clock()

# Initialize font for statistics display
font = pygame.font.SysFont(None, 24)

# Define colors
BLACK = (0, 0, 0)
GREY = (128, 128, 128)      # Neutral state (cannot click)
WHITE = (255, 255, 255)     # Active state (click allowed)
GREEN = (0, 255, 0)         # Correct timing flash
RED = (255, 0, 0)           # Error flash (clicking too fast/slow)
YELLOW = (255, 255, 0)      # Pie timer fill color
OUTLINE_COLOR = (200, 200, 200)  # Color for pie timer outline

# Define the box (centered)
box_width, box_height = 100, 100
box_x = (WIDTH - box_width) // 2
box_y = (HEIGHT - box_height) // 2
box_rect = pygame.Rect(box_x, box_y, box_width, box_height)

# Timing settings (all times in milliseconds)
TARGET_TIME = 1000         # Target time (1 second)
FEEDBACK_DURATION = 20     # Duration of the feedback flash (green or red)
NEUTRAL_DELAY_MIN = 1000   # Minimum delay before the active (white) state begins
NEUTRAL_DELAY_MAX = 3000   # Maximum delay before the active (white) state begins

# Statistics counters
total_attempts = 0
correct_attempts = 0
last_offset = None  # Stores the offset (in ms) from the target for the most recent active attempt
offset_sum = 0      # Sum of offsets (only for active state clicks)
offset_count = 0    # Number of active state attempts (with numeric offset) used for averaging

# Define states:
# "neutral"         : Grey state – clicks (except RMB) are disallowed.
# "active"          : White state – timer running, click to test your timing.
# "feedback_green"  : Green flash for correct timing.
# "feedback_red"    : Red flash for incorrect timing.
state = "neutral"
next_state_time = pygame.time.get_ticks() + random.randint(NEUTRAL_DELAY_MIN, NEUTRAL_DELAY_MAX)
active_start_time = None
feedback_start_time = None

# Pie timer settings
PIE_RADIUS = 30
PIE_MARGIN = 10
pie_center = (WIDTH - PIE_MARGIN - PIE_RADIUS, PIE_MARGIN + PIE_RADIUS)

def draw_pie(surface, center, radius, start_angle, end_angle, color, segments=30):
    """
    Draw a filled pie slice on the surface.
    
    Parameters:
      surface    : pygame.Surface on which to draw.
      center     : (x, y) tuple for the circle center.
      radius     : Radius of the circle.
      start_angle: Starting angle in radians.
      end_angle  : Ending angle in radians.
      color      : Color of the pie slice.
      segments   : Number of segments to approximate the arc.
    """
    points = [center]
    for i in range(segments + 1):
        angle = start_angle + (end_angle - start_angle) * i / segments
        x = center[0] + radius * math.cos(angle)
        y = center[1] + radius * math.sin(angle)
        points.append((x, y))
    pygame.draw.polygon(surface, color, points)

running = True
while running:
    current_time = pygame.time.get_ticks()

    # Manage state transitions
    if state == "neutral":
        if current_time >= next_state_time:
            state = "active"
            active_start_time = current_time
    elif state in ("feedback_green", "feedback_red"):
        # After the short feedback flash, reset to neutral with a new delay
        if current_time - feedback_start_time >= FEEDBACK_DURATION:
            state = "neutral"
            next_state_time = current_time + random.randint(NEUTRAL_DELAY_MIN, NEUTRAL_DELAY_MAX)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        # Handle right mouse click (m2/RMB): Force the active (white) state immediately.
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 3:
            state = "active"
            active_start_time = current_time

        # Handle left mouse button (and middle) clicks normally.
        elif event.type == pygame.MOUSEBUTTONDOWN:
            # Only process if not a right-click (handled above)
            if state == "active":
                reaction_time = current_time - active_start_time
                total_attempts += 1  # Count an attempt

                # Calculate the current offset relative to TARGET_TIME (1000 ms)
                current_offset = reaction_time - TARGET_TIME
                last_offset = current_offset
                offset_sum += current_offset
                offset_count += 1

                # Only a click between 1000 and 1050 ms gets a green flash.
                if 1000 <= reaction_time <= 1050:
                    state = "feedback_green"
                    correct_attempts += 1
                else:
                    state = "feedback_red"
                feedback_start_time = current_time

            elif state == "neutral":
                # Clicking in the neutral state (with left/middle button) counts as an error.
                total_attempts += 1
                last_offset = "Too early"
                state = "feedback_red"
                feedback_start_time = current_time

        elif event.type == pygame.KEYDOWN:
            if state == "active":
                reaction_time = current_time - active_start_time
                total_attempts += 1
                current_offset = reaction_time - TARGET_TIME
                last_offset = current_offset
                offset_sum += current_offset
                offset_count += 1
                if 1000 <= reaction_time <= 1050:
                    state = "feedback_green"
                    correct_attempts += 1
                else:
                    state = "feedback_red"
                feedback_start_time = current_time
            elif state == "neutral":
                total_attempts += 1
                last_offset = "Too early"
                state = "feedback_red"
                feedback_start_time = current_time

    # Set box color based on state
    if state == "neutral":
        box_color = GREY
    elif state == "active":
        box_color = WHITE
    elif state == "feedback_green":
        box_color = GREEN
    elif state == "feedback_red":
        box_color = RED

    # Draw background and box
    screen.fill(BLACK)
    pygame.draw.rect(screen, box_color, box_rect)

    # Draw the pie timer outline (always visible)
    pygame.draw.circle(screen, OUTLINE_COLOR, pie_center, PIE_RADIUS, 2)

    # When active, fill the pie timer based on progress
    if state == "active":
        elapsed = current_time - active_start_time
        progress = min(elapsed / TARGET_TIME, 1.0)
        start_angle = -math.pi / 2  # Start from the top
        end_angle = start_angle + progress * 2 * math.pi
        draw_pie(screen, pie_center, PIE_RADIUS, start_angle, end_angle, YELLOW)

    # Compute hit/miss statistics
    misses = total_attempts - correct_attempts
    accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

    # Compute average offset if available
    if offset_count > 0:
        avg_offset = offset_sum / offset_count
    else:
        avg_offset = None

    # Prepare statistics text
    stats_text = [
        f"Total: {total_attempts}",
        f"Hits: {correct_attempts}",
        f"Misses: {misses}",
        f"Accuracy: {accuracy:.1f}%",
    ]
    if last_offset is None:
        stats_text.append("Current Offset: N/A")
    elif isinstance(last_offset, int):
        stats_text.append(f"Current Offset: {last_offset:+d} ms")
    else:
        stats_text.append(f"Current Offset: {last_offset}")

    if avg_offset is None:
        stats_text.append("Avg Offset: N/A")
    else:
        stats_text.append(f"Avg Offset: {avg_offset:+.1f} ms")

    # Draw stats on the left side
    for idx, line in enumerate(stats_text):
        text_surface = font.render(line, True, WHITE)
        screen.blit(text_surface, (10, 10 + idx * 20))

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()
