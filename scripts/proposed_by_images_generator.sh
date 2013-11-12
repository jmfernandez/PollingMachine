#!/bin/bash

if [ $# -gt 0 ] ; then
	canddir="$1"
	for part in "$canddir"/* ; do
		if [ -d "$part" ] ; then
			polluser_id="$(basename "$part")"
			for cand in "$part"/*.[pj][pn]g ; do
				case "$cand" in
					*.jpg)
						cand_id="$(basename "$cand" .jpg)"
						photo_mime='image/jpeg'
						;;
					*.png)
						cand_id="$(basename "$cand" .png)"
						photo_mime='image/png'
						;;
					*)
						echo "ERROR: unsupported/unrecognized image type of file $cand" 1>&2
						exit 1
						;;
				esac
				echo "UPDATE PROPOSED_BY SET photo=x'$(hexdump -v -e '1/1 "%02x"' "$cand")', photo_mime='$photo_mime' WHERE cand_id='$cand_id' AND id_mail='${polluser_id}@cnio.es';"
				echo
			done
		fi
	done
else
	echo "ERROR: This script needs as input a directory with a subdirectory per voter, which have to contain the images for the proposed candidates" 1>&2
	exit 1
fi
