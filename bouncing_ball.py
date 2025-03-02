import pygame
import sys
import math

# Constants
WIDTH, HEIGHT = 800, 600
BALL_RADIUS = 20
SQUARE_SIZE = 400
GRAVITY = 0.5
BOUNCE_DAMPENING = 0.8  # Energy loss on each bounce
ROTATION_SPEED = 1  # Degrees per frame

# Colors
RED = (255, 0, 0)
BLUE = (0, 0, 255)
WHITE = (255, 255, 255)

class Ball:
    def __init__(self):
        self.x = WIDTH // 2
        self.y = HEIGHT // 2
        self.vx = 0
        self.vy = 0
        self.radius = BALL_RADIUS

    def apply_gravity(self):
        self.vy += GRAVITY

    def update(self, square_angle):
        self.apply_gravity()
        self.x += self.vx
        self.y += self.vy

        # Calculate square corners
        square_center = (WIDTH // 2, HEIGHT // 2)
        square_half_size = SQUARE_SIZE // 2
        angle = math.radians(square_angle)
        
        # Top-right corner
        tr_x = square_center[0] + square_half_size * math.cos(angle)
        tr_y = square_center[1] - square_half_size * math.sin(angle)
        
        # Top-left corner
        tl_x = square_center[0] - square_half_size * math.sin(angle)
        tl_y = square_center[1] - square_half_size * math.cos(angle)
        
        # Bottom-left corner
        bl_x = square_center[0] - square_half_size * math.cos(angle)
        bl_y = square_center[1] + square_half_size * math.sin(angle)
        
        # Bottom-right corner
        br_x = square_center[0] + square_half_size * math.sin(angle)
        br_y = square_center[1] + square_half_size * math.cos(angle)
        
        # Get all four sides as lines
        sides = [
            ((tr_x, tr_y), (tl_x, tl_y)),  # Top side
            ((tl_x, tl_y), (bl_x, bl_y)),  # Left side
            ((bl_x, bl_y), (br_x, br_y)),  # Bottom side
            ((br_x, br_y), (tr_x, tr_y))   # Right side
        ]
        
        # Check collision with each side
        for side in sides:
            self.handle_collision(side)

    def handle_collision(self, side):
        # Calculate the side's equation (ax + by + c = 0)
        (x1, y1), (x2, y2) = side
        a = y2 - y1
        b = x1 - x2
        c = x2*y1 - x1*y2
        
        # Calculate distance from ball center to the line
        distance = abs(a*self.x + b*self.y + c) / math.sqrt(a**2 + b**2)
        
        if distance < self.radius:
            # Calculate normal vector components
            normal_x = a / math.sqrt(a**2 + b**2)
            normal_y = b / math.sqrt(a**2 + b**2)
            
            # Reflect the velocity vector
            dot_product = self.vx * normal_x + self.vy * normal_y
            self.vx = self.vx - 2 * dot_product * normal_x * BOUNCE_DAMPENING
            self.vy = self.vy - 2 * dot_product * normal_y * BOUNCE_DAMPENING

            # Move the ball back to the edge of the square
            if distance < self.radius:
                penetration = self.radius - distance
                self.x -= normal_x * penetration
                self.y -= normal_y * penetration

    def draw(self, screen):
        pygame.draw.circle(screen, RED, (int(self.x), int(self.y)), self.radius)

def draw_rotating_square(screen, angle):
    square_center = (WIDTH // 2, HEIGHT // 2)
    square_half_size = SQUARE_SIZE // 2
    
    angle_rad = math.radians(angle)
    
    # Calculate rotated corners
    corners = [
        (square_center[0] + square_half_size * math.cos(angle_rad), square_center[1] - square_half_size * math.sin(angle_rad)),
        (square_center[0] - square_half_size * math.sin(angle_rad), square_center[1] - square_half_size * math.cos(angle_rad)),
        (square_center[0] - square_half_size * math.cos(angle_rad), square_center[1] + square_half_size * math.sin(angle_rad)),
        (square_center[0] + square_half_size * math.sin(angle_rad), square_center[1] + square_half_size * math.cos(angle_rad))
    ]
    
    # Draw square
    for i in range(4):
        pygame.draw.line(screen, BLUE, corners[i], corners[(i+1)%4], 3)

def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Bouncing Ball in Rotating Square")
    clock = pygame.time.Clock()
    
    ball = Ball()
    rotation_angle = 0
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
                
        screen.fill(WHITE)
        
        # Update ball and draw square
        rotation_angle += ROTATION_SPEED
        ball.update(rotation_angle)
        draw_rotating_square(screen, rotation_angle)
        ball.draw(screen)
        
        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()