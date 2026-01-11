---
title: "Shellcode Runner C++, basics"
date: 2026-01-10
layout: post
project: "Sliver C2 & Fileless Malware"
---

## Introduction

Hey everyone,

I want to start this post by making one thing very clear: I’m not going to show how to build a fully functional shellcode runner. The goal here is to walk you through the methods I used to create mine, along with a few C++ examples demonstrating how to apply these techniques.

## System Call Obfuscation

System Call Obfuscation, also known as D/Invoke in C#, is a method that can be widely used to call Windows functions at runtime.

Abaixo, um exemplo dessa técnica aplicada a função "CreateToolhelp32Snapshot", usada principalmente na técnica de Process Injection

`C++`
```cpp

// CreateToolhelp32Snapshot
typedef HANDLE(WINAPI* myToolSnapshot)(DWORD, DWORD);

HMODULE kernel32dll = LoadLibraryA("kernel32.dll");

myToolSnapshot My_Snapshot = (myToolSnapshot)GetProcAddress(kernel32dll, (LPCSTR)"CreateToolhelp32Snapshot");

My_Snapshot(TH32CS_SNAPPROCESS, 0)

```
### What this is doing

- **`typedef ... myToolSnapshot`**  
  Defines a *function pointer type* that matches the original `CreateToolhelp32Snapshot` signature.  
  This matters because when calling a function via pointer, the **parameter types** and **calling convention** (`WINAPI`) must match exactly.

- **`LoadLibraryA("kernel32.dll")`**  
  Loads `kernel32.dll` and returns a module handle (`HMODULE`). If the module is already loaded, Windows typically just increments its reference count.

- **`GetProcAddress(kernel32dll, "CreateToolhelp32Snapshot")`**  
  Resolves the **address** of `CreateToolhelp32Snapshot` at runtime and returns it as a raw pointer, which is then cast to `myToolSnapshot`.

- **`My_Snapshot(TH32CS_SNAPPROCESS, 0)`**  
  Requests a snapshot of the current process list. When using `TH32CS_SNAPPROCESS`, the second argument (`th32ProcessID`) is effectively **not used**, so passing `0` is standard in examples.

#### Reference
- [CreateToolhelp32Snapshot (Microsoft Docs)](https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-createtoolhelp32snapshot)


## Process Injection

The malware relies on process injection to write the shellcode into memory regions of another process, such as notepad.exe, svchost.exe, chrome.exe, etc.

First, we need to define a target process — for example, notepad.exe — and then use Windows APIs to find its PID. With the PID in hand, we can allocate memory inside that process.

### Searching for the PID !!!

You have defined notepad.exe as your target process, and the next step is to retrieve its Process ID (PID). To achieve this, the code uses CreateToolhelp32Snapshot, a Windows API function that captures a snapshot of all currently running processes on the system. Once the snapshot is created, it is traversed using Process32First and Process32Next, while _wcsicmp is used to perform a case-insensitive comparison of process names in order to identify the target executable.

`C++`
```cpp
DWORD GetNotepadPID() {
    DWORD pid = 0;

    // Create a snapshot of all running processes
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        std::cerr << "Failed to create process snapshot\n";
        return 0;
    }

    PROCESSENTRY32 pe;
    pe.dwSize = sizeof(PROCESSENTRY32); // Must be set before calling Process32First

    // Retrieve the first process from the snapshot
    if (Process32First(hSnapshot, &pe)) {
        do {
            // Compare the executable name (case-insensitive)
            if (_wcsicmp(pe.szExeFile, L"notepad.exe") == 0) {
                pid = pe.th32ProcessID; // Store the process ID
                break;
            }
        } while (Process32Next(hSnapshot, &pe)); // Move to the next process
    } else {
        std::cerr << "Process32First failed\n";
    }

    // Always close the snapshot handle
    CloseHandle(hSnapshot);

    return pid;
}

int main() {
    DWORD pid = GetNotepadPID();

    if (pid != 0) {
        std::cout << "notepad.exe found! PID = " << pid << std::endl;
    } else {
        std::cout << "notepad.exe is not running.\n";
    }

    return 0;
}
```
This code leverages the Windows ToolHelp API to enumerate all running processes by creating a snapshot of the system’s current process state. Using Process32First, it retrieves the first process entry and then iterates through the remaining processes with Process32Next. During this iteration, the code performs a case-insensitive comparison of each process’s executable name against notepad.exe. This approach allows the program to systematically search through all active processes without prior knowledge of their order or quantity.

Once the target process is identified, the corresponding Process ID (PID) is extracted directly from the process entry structure and returned for later use. At no point does the code open or interact with the target process itself; it only reads metadata provided by the operating system. If notepad.exe is not running at the time the snapshot is taken, the function completes gracefully and indicates that no valid PID was found.

## Request for Shellcode

```cpp

```