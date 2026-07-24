Option Explicit

Dim fileSystem, shell, botDirectory, botScript, nodePath, command, exitCode

Set fileSystem = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

botDirectory = fileSystem.GetParentFolderName(WScript.ScriptFullName)
botScript = fileSystem.BuildPath(botDirectory, "src\index.js")
If WScript.Arguments.Count < 1 Then WScript.Quit 87
nodePath = WScript.Arguments.Item(0)
If Not fileSystem.FileExists(nodePath) Then WScript.Quit 2
shell.CurrentDirectory = botDirectory

' Keep the bot attached to this hidden script so Task Scheduler can restart it on failure.
command = """" & nodePath & """ """ & botScript & """"
exitCode = shell.Run(command, 0, True)
WScript.Quit exitCode
