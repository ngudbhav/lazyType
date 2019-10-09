#include <iostream>
#include <windows.h>

int main(int argc, char **argv)
{
    //Creating the command. See https://www.codeproject.com/Articles/12153/SetEnv
    std::string cmd = "SetEnv.exe -a PATH %\"";
    //Get the current working directory
    TCHAR path[MAX_PATH];
    if(argv[1]){
        strcpy((char *)path, argv[1]);
    }
    else{
        GetCurrentDirectory(MAX_PATH, path);
    }
    //Add the bin folder to the current working directory
    strcat((char *)path, "\\bin\"");
    std::string p = (char *)path;
    cmd = cmd + p;
    //Cast to const char *
    const char *cstr = cmd.c_str();
    //Check for supported libraries
    if(system(NULL)){
        //Execute the command
        int res = system(cstr);
        if(res == 1 || res == 5){
            //std::cout << "Admin rights denied";
            std::cout<< 1;
        }
        else if(res == 0){
            //std::cout << "Success Addition to the system PATH.";
            std::cout<< 0;
        }
    }
    else{
        //std::cout << "Platform Unsupported. Please file an issue here https://github.com/ngudbhav/lazyType/issues";
        std::cout<< - 1;
    }
    return 0;
}