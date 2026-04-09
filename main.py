import os
import decky
import asyncio
import subprocess
import re

UPOWER = "/usr/bin/upower"

class Plugin:
    async def _main(self):
        self._loop = asyncio.get_event_loop()
        decky.logger.info("Zotac Zone Battery Plugin Loaded!")

    async def _unload(self):
        if self._loop and not self._loop.is_closed():
            self._loop.stop()
        decky.logger.info("Battery plugin unloaded.")

    async def _uninstall(self):
        decky.logger.info("Battery plugin uninstalled.")

    def _find_battery_path(self):
        try:
            output = subprocess.check_output([UPOWER, "--enumerate"], universal_newlines=True)
            for line in output.splitlines():
                line = line.strip()
                if "battery" in line.lower() and "BAT" in line:
                    return line
            for line in output.splitlines():
                if "battery" in line.lower():
                    return line.strip()
        except Exception as e:
            decky.logger.error(f"Failed to enumerate UPower devices: {e}")

        for path in [
            "/org/freedesktop/UPower/devices/battery_BAT0",
            "/org/freedesktop/UPower/devices/battery_BAT1",
            "/org/freedesktop/UPower/devices/battery_cw2015_battery",
        ]:
            try:
                subprocess.check_output([UPOWER, "-i", path], universal_newlines=True, stderr=subprocess.DEVNULL)
                return path
            except subprocess.CalledProcessError:
                continue
        return None

    def _format_time(self, hours: float) -> str:
        if hours <= 0:
            return "00:00"
        total_minutes = int(hours * 60)
        return f"{total_minutes // 60:02d}:{total_minutes % 60:02d}"

    def _time_remaining(self, output: str, energy_now: float, energy_rate: float) -> str:
        match = re.search(r'time to empty:\s+([\d.]+)\s+(hours?|minutes?|seconds?)', output)
        if match:
            value, unit = float(match.group(1)), match.group(2)
            divisor = 1 if "hour" in unit else 60 if "minute" in unit else 3600
            return self._format_time(value / divisor)

        if energy_now > 0 and energy_rate > 0:
            return self._format_time(energy_now / energy_rate)

        try:
            for bat in ["/sys/class/power_supply/BAT0", "/sys/class/power_supply/BAT1"]:
                cur  = os.path.join(bat, "current_now")
                chg  = os.path.join(bat, "charge_now")
                pwr  = os.path.join(bat, "power_now")
                enow = os.path.join(bat, "energy_now")
                volt = os.path.join(bat, "voltage_now")

                if os.path.exists(cur) and os.path.exists(chg):
                    with open(cur) as f: c = int(f.read().strip())
                    with open(chg) as f: q = int(f.read().strip())
                    if c > 0:
                        return self._format_time(q / c)

                if os.path.exists(pwr) and os.path.exists(enow):
                    with open(pwr)  as f: p = int(f.read().strip())
                    with open(enow) as f: e = int(f.read().strip())
                    if p > 0:
                        return self._format_time(e / p)

                if os.path.exists(volt) and os.path.exists(cur) and os.path.exists(enow):
                    with open(volt) as f: v = int(f.read().strip())
                    with open(cur)  as f: c = int(f.read().strip())
                    with open(enow) as f: e = int(f.read().strip())
                    power_w = (v / 1e6) * (c / 1e6)
                    if power_w > 0:
                        return self._format_time((e / 1e6) / power_w)
        except Exception as ex:
            decky.logger.error(f"Sys fallback time calc failed: {ex}")

        return "N/A"

    async def get_battery_info(self):
        try:
            battery_path = self._find_battery_path()
            if not battery_path:
                return {"error": "No battery device found", "percentage": 0, "fullCharge": 0, "batterySize": 0, "isCharging": False, "timeRemaining": "N/A"}

            output = subprocess.check_output([UPOWER, "-i", battery_path], universal_newlines=True)

            def find(pattern):
                m = re.search(pattern, output)
                return m.group(1) if m else None

            full_charge  = float(find(r'energy-full:\s+([\d.]+)')        or 0)
            battery_size = float(find(r'energy-full-design:\s+([\d.]+)') or 0)
            energy_now   = float(find(r'energy:\s+([\d.]+)')             or 0)
            percentage   = float(find(r'percentage:\s+([\d.]+)%')        or 0)
            state        =       find(r'state:\s+(\S+)')                 or "unknown"
            voltage      = float(find(r'voltage:\s+([\d.]+)')            or 0)
            energy_rate  = float(find(r'energy-rate:\s+([\d.]+)')        or 0)

            is_charging = state in ("charging", "fully-charged")

            if not is_charging and percentage > 0:
                time_remaining = self._time_remaining(output, energy_now, energy_rate)
            elif is_charging:
                time_remaining = "Charging"
            else:
                time_remaining = "N/A"

            return {
                "fullCharge":    full_charge,
                "batterySize":   battery_size,
                "energyNow":     energy_now,
                "percentage":    percentage,
                "state":         state,
                "voltage":       voltage,
                "energyRate":    energy_rate,
                "timeRemaining": time_remaining,
                "isCharging":    is_charging,
                "batteryHealth": round((full_charge / battery_size) * 100, 1) if battery_size > 0 else 0.0,
                "batteryPath":   battery_path,
            }

        except subprocess.CalledProcessError as e:
            decky.logger.error(f"upower failed: {e}")
            return {"error": str(e), "percentage": 0, "fullCharge": 0, "batterySize": 0, "isCharging": False, "timeRemaining": "N/A"}
        except Exception as e:
            decky.logger.error(f"get_battery_info failed: {e}")
            return {"error": str(e), "percentage": 0, "fullCharge": 0, "batterySize": 0, "isCharging": False, "timeRemaining": "N/A"}

    async def _migration(self):
        decky.logger.info("Migrating")
        decky.migrate_logs(os.path.join(decky.DECKY_USER_HOME, ".config", "zonebattery", "zonebattery.log"))
        decky.migrate_settings(
            os.path.join(decky.DECKY_HOME, "settings", "zonebattery.json"),
            os.path.join(decky.DECKY_USER_HOME, ".config", "zonebattery"))
        decky.migrate_runtime(
            os.path.join(decky.DECKY_HOME, "zonebattery"),
            os.path.join(decky.DECKY_USER_HOME, ".local", "share", "zonebattery"))
