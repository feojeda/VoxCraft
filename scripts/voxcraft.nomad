job "voxcraft" {
  datacenters = ["dc1"]
  type        = "service"

  update {
    max_parallel     = 1
    health_check     = "task_states"
    min_healthy_time = "30s"
    healthy_deadline = "5m"
    auto_revert      = true
    stagger          = "30s"
  }

  reschedule {
    attempts       = 6
    interval       = "30m"
    delay          = "15s"
    delay_function = "exponential"
    max_delay      = "120s"
    unlimited      = false
  }

  group "backend" {
    count = 1

    restart {
      attempts = 3
      interval = "5m"
      delay    = "15s"
      mode     = "fail"
    }

    migrate {
      max_parallel     = 1
      health_check     = "task_states"
      min_healthy_time = "30s"
      healthy_deadline = "5m"
    }

    network {
      port "http" {
        static = 3005
      }
      port "api" {
        static = 8001
      }
      port "redis" {
        static = 6379
      }
    }

    task "redis" {
      driver = "raw_exec"

      config {
        command = "redis-server"
        args    = [
          "--port", "6379",
          "--dir", "/opt/voxcraft/redis-data",
          "--appendonly", "yes",
          "--appendfsync", "everysec",
        ]
      }

      service {
        name = "voxcraft-redis"
        tags = ["redis", "broker", "cache"]
        meta {
          description = "VoxCraft Redis - Message broker and result backend for Celery"
          stack       = "redis"
          manage      = "nomad job restart/stop voxcraft"
        }
        port = "redis"

        check {
          type     = "tcp"
          name     = "Redis TCP"
          interval = "15s"
          timeout  = "5s"
        }

        check_restart {
          limit           = 3
          grace           = "60s"
          ignore_warnings = false
        }
      }
    }

    task "api" {
      driver = "raw_exec"

      config {
        command = "/bin/bash"
        args    = ["/opt/voxcraft/current/scripts/start_api.sh"]
      }

      env {
        PYTHONPATH = "/opt/voxcraft/current"
      }

      service {
        name = "voxcraft"
        tags = ["api", "tts", "fastapi", "python"]
        meta {
          description = "VoxCraft API - Text-to-speech generation with voice cloning and prosody control"
          version     = "0.1.0"
          stack       = "python/fastapi"
          manage      = "nomad job restart/stop voxcraft"
        }
        port = "api"

        check {
          type         = "http"
          name         = "Health"
          path         = "/api/health"
          interval     = "15s"
          timeout      = "5s"
          address_mode = "host"
        }

        check_restart {
          limit           = 3
          grace           = "90s"
          ignore_warnings = false
        }
      }
    }

    task "worker" {
      driver = "raw_exec"

      config {
        command = "/bin/bash"
        args    = ["/opt/voxcraft/current/scripts/start_worker.sh"]
      }

      env {
        PYTHONPATH = "/opt/voxcraft/current"
      }

      service {
        name = "voxcraft-worker"
        tags = ["worker", "celery", "tts"]
        meta {
          description = "VoxCraft Celery Worker - Async TTS generation jobs"
          version     = "0.1.0"
          stack       = "python/celery"
          manage      = "nomad job restart/stop voxcraft"
        }
      }
    }

    task "frontend" {
      driver = "raw_exec"

      config {
        command = "/bin/bash"
        args    = ["/opt/voxcraft/current/scripts/start_frontend.sh"]
      }

      service {
        name = "voxcraft-web"
        tags = ["frontend", "nextjs", "web"]
        meta {
          description = "VoxCraft Frontend - Next.js web UI for TTS generation"
          version     = "0.1.0"
          stack       = "node/nextjs"
          manage      = "nomad job restart/stop voxcraft"
        }
        port = "http"

        check {
          type         = "http"
          name         = "Health"
          path         = "/"
          interval     = "15s"
          timeout      = "5s"
          address_mode = "host"
        }

        check_restart {
          limit           = 3
          grace           = "90s"
          ignore_warnings = false
        }
      }
    }
  }
}
