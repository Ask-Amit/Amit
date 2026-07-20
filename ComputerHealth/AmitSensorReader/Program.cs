using System.Text.Json.Nodes;
using LibreHardwareMonitor.Hardware;

if (args.Length < 2)
{
    Console.Error.WriteLine("Usage: AmitSensorReader.exe <outputJsonPath> <stopFlagPath>");
    return 1;
}

string outputPath = args[0];
string stopFlagPath = args[1];

var computer = new Computer
{
    IsCpuEnabled = true,
    IsGpuEnabled = true,
    IsMemoryEnabled = true,
    IsMotherboardEnabled = true,
    IsStorageEnabled = true,
    IsNetworkEnabled = true,
    IsControllerEnabled = true,
    IsPsuEnabled = true,
    IsBatteryEnabled = true
};

try { computer.Open(); }
catch (Exception ex)
{
    Console.Error.WriteLine("FATAL: Computer.Open() failed: " + ex);
    return 2;
}

try
{
    while (!File.Exists(stopFlagPath))
    {
        // Real LibreHardwareMonitor web server output nests one extra level
        // under root - Sensor > COMPUTERNAME > Motherboard/CPU/... - not
        // Sensor > Motherboard directly. resource_watcher.ps1 and
        // app_behavior_watcher.ps1 both strip exactly "Sensor>COMPUTERNAME>"
        // from every log line assuming that shape; skipping this level here
        // made them strip the actual hardware name instead, breaking the
        // Hardware tab's history view even though live data still worked.
        var root = new JsonObject
        {
            ["id"] = 0,
            ["Text"] = "Sensor",
            ["Children"] = new JsonArray()
        };
        var computerNode = new JsonObject
        {
            ["id"] = 1,
            ["Text"] = Environment.MachineName,
            ["Children"] = new JsonArray()
        };
        ((JsonArray)root["Children"]!).Add(computerNode);
        var hwChildren = (JsonArray)computerNode["Children"]!;

        int nextId = 2;
        foreach (var hw in computer.Hardware)
        {
            hw.Update();
            var hwNode = BuildHardwareNode(hw, ref nextId);
            hwChildren.Add(hwNode);
        }

        try
        {
            string tmp = outputPath + ".tmp";
            File.WriteAllText(tmp, root.ToJsonString());
            File.Copy(tmp, outputPath, true);
            File.Delete(tmp);
        }
        catch
        {
            // Skip this cycle - dashboard just reads a slightly stale file, not fatal.
        }

        Thread.Sleep(2000);
    }
}
finally
{
    computer.Close();
}

return 0;

static JsonObject BuildHardwareNode(IHardware hw, ref int nextId)
{
    var node = new JsonObject
    {
        ["id"] = nextId++,
        ["Text"] = hw.Name,
        ["Children"] = new JsonArray()
    };
    var children = (JsonArray)node["Children"]!;

    foreach (var group in hw.Sensors.GroupBy(s => s.SensorType))
    {
        var groupNode = new JsonObject
        {
            ["id"] = nextId++,
            ["Text"] = PluralizeSensorType(group.Key),
            ["Children"] = new JsonArray()
        };
        var groupChildren = (JsonArray)groupNode["Children"]!;
        foreach (var sensor in group)
        {
            groupChildren.Add(new JsonObject
            {
                ["id"] = nextId++,
                ["Text"] = sensor.Name,
                ["Value"] = FormatValue(sensor.Value),
                ["Min"] = FormatValue(sensor.Min),
                ["Max"] = FormatValue(sensor.Max),
                ["SensorId"] = sensor.Identifier.ToString(),
                ["Type"] = sensor.SensorType.ToString()
            });
        }
        children.Add(groupNode);
    }

    foreach (var sub in hw.SubHardware)
    {
        sub.Update();
        children.Add(BuildHardwareNode(sub, ref nextId));
    }

    return node;
}

static string FormatValue(float? v) => v.HasValue ? v.Value.ToString("0.##") : "-";

static string PluralizeSensorType(SensorType t) => t switch
{
    SensorType.Data => "Data",
    SensorType.SmallData => "Data",
    _ => t.ToString() + "s"
};
