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

![COMINGSOON]({{ "/assets/img/comingsoon.png" | relative_url }})

```cpp

```

## Request for Shellcode

```cpp

```