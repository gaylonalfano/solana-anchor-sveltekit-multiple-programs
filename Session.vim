let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Code/solana-anchor-sveltekit-multiple-programs
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
let s:shortmess_save = &shortmess
if &shortmess =~ 'A'
  set shortmess=aoOA
else
  set shortmess=aoO
endif
badd +1 ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
badd +0 ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_custom_program.rs
badd +1 ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
badd +1 ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs//15198:/bin/zsh
badd +1 term://~/Code/solana-anchor-sveltekit-multiple-programs//15726:/bin/zsh
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//16350:/bin/zsh
badd +0 term://~/Code/solana-anchor-sveltekit-multiple-programs//16992:/bin/zsh
argglobal
%argdel
$argadd .
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabnew +setlocal\ bufhidden=wipe
tabrewind
argglobal
enew
file .
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 78 + 78) / 156)
exe 'vert 2resize ' . ((&columns * 77 + 78) / 156)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_custom_program.rs
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_custom_program.rs", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_custom_program.rs | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_custom_program.rs | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/programs/onchain-voting-multiple-polls/src/instructions/create_custom_program.rs
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/tests/onchain-voting-multiple-polls.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 78 + 78) / 156)
exe 'vert 2resize ' . ((&columns * 77 + 78) / 156)
tabnext
edit ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe 'vert 1resize ' . ((&columns * 77 + 78) / 156)
exe 'vert 2resize ' . ((&columns * 78 + 78) / 156)
argglobal
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs", ":p")) | buffer ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs | else | edit ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs | endif
if &buftype ==# 'terminal'
  silent file ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/tests/non-custodial-escrow.ts
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
silent! normal! zE
let &fdl = &fdl
let s:l = 1 - ((0 * winheight(0) + 31) / 62)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 77 + 78) / 156)
exe 'vert 2resize ' . ((&columns * 78 + 78) / 156)
tabnext
let s:save_splitbelow = &splitbelow
let s:save_splitright = &splitright
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd _ | wincmd |
split
1wincmd k
wincmd w
wincmd w
wincmd _ | wincmd |
split
1wincmd k
wincmd w
let &splitbelow = s:save_splitbelow
let &splitright = s:save_splitright
wincmd t
let s:save_winminheight = &winminheight
let s:save_winminwidth = &winminwidth
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 77 + 78) / 156)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 77 + 78) / 156)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 78 + 78) / 156)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 78 + 78) / 156)
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//15198:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//15198:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//15198:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//15198:/bin/zsh
endif
balt ~/Code/solana-anchor-sveltekit-multiple-programs/programs/non-custodial-escrow/src/lib.rs
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//16992:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//16992:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//16992:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//16992:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//15198:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//15726:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//15726:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//15726:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//15726:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//15198:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
argglobal
if bufexists(fnamemodify("term://~/Code/solana-anchor-sveltekit-multiple-programs//16350:/bin/zsh", ":p")) | buffer term://~/Code/solana-anchor-sveltekit-multiple-programs//16350:/bin/zsh | else | edit term://~/Code/solana-anchor-sveltekit-multiple-programs//16350:/bin/zsh | endif
if &buftype ==# 'terminal'
  silent file term://~/Code/solana-anchor-sveltekit-multiple-programs//16350:/bin/zsh
endif
balt term://~/Code/solana-anchor-sveltekit-multiple-programs//15726:/bin/zsh
setlocal fdm=manual
setlocal fde=
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 1 - ((0 * winheight(0) + 15) / 31)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 1
normal! 0
wincmd w
4wincmd w
exe '1resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 1resize ' . ((&columns * 77 + 78) / 156)
exe '2resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 2resize ' . ((&columns * 77 + 78) / 156)
exe '3resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 3resize ' . ((&columns * 78 + 78) / 156)
exe '4resize ' . ((&lines * 31 + 33) / 66)
exe 'vert 4resize ' . ((&columns * 78 + 78) / 156)
tabnext 4
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0 && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20
let &shortmess = s:shortmess_save
let &winminheight = s:save_winminheight
let &winminwidth = s:save_winminwidth
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
set hlsearch
nohlsearch
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
