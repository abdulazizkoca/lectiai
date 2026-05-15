#!/usr/bin/env python3
"""
Lectio AI Camera System v4.0
Unified, Optimized, Production-Ready Entry Point

Quick Start:
  python main.py                    # Run with defaults
  python main.py -c config.yaml    # Custom config
  python main.py --create-config    # Generate config file
"""

import argparse
import sys
import signal
import time
import cv2
from pathlib import Path
from typing import Optional
import logging

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('lectio_camera.log', mode='a')
    ]
)
logger = logging.getLogger(__name__)

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.config import load_config, Config, get_config
from src.camera import CameraManager, CameraSource, create_usb_camera
from src.pipeline import ProcessingPipeline, ProcessingResult
from src.rendering import OverlayRenderer


class LectioCameraSystem:
    """Unified camera system main controller"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config = load_config(config_path) if config_path else load_config()
        self.running = False
        
        # Components
        self.camera_manager: Optional[CameraManager] = None
        self.pipeline: Optional[ProcessingPipeline] = None
        self.renderer: Optional[OverlayRenderer] = None
        
        # Statistics
        self.frame_count = 0
        self.start_time = 0.0
        
        # Signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        logger.info("LectioCameraSystem v4.0 initialized")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.stop()
        sys.exit(0)
    
    def initialize(self) -> bool:
        """Initialize all components"""
        try:
            cfg = get_config()
            
            # Initialize camera manager
            self.camera_manager = CameraManager()
            
            for cam_cfg in cfg.cameras:
                if cam_cfg.type == "usb":
                    camera = create_usb_camera(
                        camera_id=cam_cfg.id,
                        device_index=int(cam_cfg.source),
                        width=cam_cfg.width,
                        height=cam_cfg.height,
                        fps=cam_cfg.fps
                    )
                else:
                    from src.camera import create_ip_camera
                    camera = create_ip_camera(
                        camera_id=cam_cfg.id,
                        url=cam_cfg.source,
                        username=cam_cfg.username,
                        password=cam_cfg.password,
                        width=cam_cfg.width,
                        height=cam_cfg.height,
                        fps=cam_cfg.fps
                    )
                
                self.camera_manager.add_camera(camera)
            
            # Initialize pipeline
            self.pipeline = ProcessingPipeline(cfg.pipeline)
            if not self.pipeline.start():
                logger.error("Failed to start pipeline")
                return False
            
            # Initialize renderer
            self.renderer = OverlayRenderer(cfg.render)
            
            # Warmup
            self.pipeline.warmup()
            
            logger.info("All components initialized successfully")
            return True
            
        except Exception as e:
            logger.exception("Initialization failed")
            return False
    
    def start(self) -> bool:
        """Start the system"""
        if not self.initialize():
            return False
        
        if not self.camera_manager.start_all():
            logger.error("Failed to start cameras")
            return False
        
        self.running = True
        self.start_time = time.time()
        
        logger.info("System started successfully")
        
        # Main loop
        self._main_loop()
        
        return True
    
    def _main_loop(self):
        """Main processing loop"""
        cfg = get_config()
        
        fps_history = []
        last_time = time.time()
        
        try:
            while self.running:
                # Read frames from all cameras
                frames = self.camera_manager.read_all()
                
                for cam_id, frame_data in frames.items():
                    if frame_data is None:
                        continue
                    
                    # Submit to pipeline
                    self.pipeline.submit_frame(frame_data)
                
                # Get processed results
                result = self.pipeline.get_result(timeout=0.1)
                
                if result:
                    # Calculate FPS
                    current_time = time.time()
                    fps = 1.0 / (current_time - last_time + 1e-6)
                    fps_history.append(fps)
                    if len(fps_history) > 30:
                        fps_history.pop(0)
                    avg_fps = sum(fps_history) / len(fps_history)
                    last_time = current_time
                    
                    # Render
                    if cfg.output.display and self.renderer:
                        display_frame = self.renderer.render(result, avg_fps)
                        
                        cv2.imshow(f"Lectio AI - {result.camera_id}", display_frame)
                        
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            logger.info("Quit requested by user")
                            self.running = False
                            break
                    
                    self.frame_count += 1
                
        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        
        finally:
            cv2.destroyAllWindows()
    
    def stop(self):
        """Stop the system"""
        if not self.running:
            return
        
        logger.info("Stopping system...")
        self.running = False
        
        # Stop components
        if self.camera_manager:
            self.camera_manager.stop_all()
        
        if self.pipeline:
            self.pipeline.stop()
        
        # Log statistics
        runtime = time.time() - self.start_time
        logger.info(f"Runtime: {runtime:.1f}s")
        logger.info(f"Frames processed: {self.frame_count}")
        if self.frame_count > 0:
            logger.info(f"Average FPS: {self.frame_count / runtime:.1f}")
        
        logger.info("System stopped")
    
    def get_stats(self) -> dict:
        """Get system statistics"""
        stats = {
            "running": self.running,
            "frame_count": self.frame_count,
            "runtime": time.time() - self.start_time if self.running else 0
        }
        
        if self.pipeline:
            stats["pipeline"] = self.pipeline.get_stats()
        
        if self.camera_manager:
            stats["cameras"] = self.camera_manager.get_stats()
        
        return stats


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Lectio AI Camera System v4.0'
    )
    parser.add_argument(
        '-c', '--config',
        type=str,
        default='config.yaml',
        help='Configuration file path'
    )
    parser.add_argument(
        '--create-config',
        action='store_true',
        help='Create default config file and exit'
    )
    parser.add_argument(
        '--stats',
        action='store_true',
        help='Show system stats and exit'
    )
    parser.add_argument(
        '--headless',
        action='store_true',
        help='Run without display (headless mode)'
    )
    
    args = parser.parse_args()
    
    # Create config
    if args.create_config:
        config = Config()
        config.create_default(args.config)
        print(f"Default configuration created: {args.config}")
        return 0
    
    # Load config
    if not Path(args.config).exists() and not args.stats:
        logger.warning(f"Config file not found: {args.config}")
        logger.info("Creating default configuration...")
        config = Config()
        config.create_default(args.config)
    
    # Create system
    system = LectioCameraSystem(args.config)
    
    # Override headless mode
    if args.headless:
        from src.config import get_config
        get_config().output.display = False
    
    # Stats only
    if args.stats:
        import json
        print(json.dumps(system.get_stats(), indent=2))
        return 0
    
    # Start system
    try:
        if system.start():
            return 0
        return 1
    except Exception as e:
        logger.exception("Fatal error")
        return 1


if __name__ == "__main__":
    sys.exit(main())
